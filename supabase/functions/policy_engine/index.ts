import { corsHeaders } from '../_shared/cors.ts'
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import { assertTenantAccess, createServiceClient, createUserClient, getTokenFromRequest, getUserFromJwt } from '../_shared/tenantShield.ts';
import { ConditionSchema, evaluateCondition, hasStringExpression } from '../_shared/policyEvaluator.ts';

const PolicyRequestSchema = z.object({
  document_id: z.string().min(1, "Document ID is required"),
  policy_types: z.array(z.enum(['validation', 'approval', 'routing', 'fraud'])).optional(),
  context: z.record(z.any()).optional().default({}),
  tenant_id: z.string().uuid("Tenant ID must be a UUID"),
});


interface PolicyEvaluationResult {
  policy_id: string;
  policy_name: string;
  triggered: boolean;
  actions: any[];
  details?: any;
}

function evaluatePolicy(policy: any, context: Record<string, any>): PolicyEvaluationResult {
  const conditions = (policy.conditions || {}) as Record<string, unknown>;
  const actions = Array.isArray(policy.actions) ? policy.actions : [];

  let triggered = true;
  const details: any = {};

  for (const [conditionKey, conditionValue] of Object.entries(conditions)) {
    const parsedCondition = ConditionSchema.safeParse(conditionValue);
    if (!parsedCondition.success) {
      details[conditionKey] = { result: false, error: 'Invalid condition schema' };
      triggered = false;
      continue;
    }

    try {
      const result = evaluateCondition(parsedCondition.data, context);
      details[conditionKey] = {
        ...parsedCondition.data,
        actual: context[parsedCondition.data.field],
        result,
      };

      if (!result) {
        triggered = false;
      }
    } catch (error) {
      details[conditionKey] = {
        ...parsedCondition.data,
        result: false,
        error: error instanceof Error ? error.message : 'Evaluation failed',
      };
      triggered = false;
    }
  }

  return {
    policy_id: policy.id,
    policy_name: policy.policy_name,
    triggered,
    actions: triggered ? actions : [],
    details,
  };
}

function calculateDiff(before: any, after: any): any {
  const diff: any = {};

  for (const key in after) {
    if (before[key] !== after[key]) {
      diff[key] = { before: before[key], after: after[key] };
    }
  }

  for (const key in before) {
    if (!(key in after)) {
      diff[key] = { before: before[key], after: null };
    }
  }

  return diff;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const user = await getUserFromJwt(token);

    const body = await req.json();
    const parsed = PolicyRequestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: parsed.error.issues
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { document_id, policy_types = ['validation', 'approval', 'routing', 'fraud'], context, tenant_id } = parsed.data;
    assertTenantAccess(tenant_id, { request: req, userId: user.id });

    const supabase = createUserClient(token);
    const serviceSupabase = createServiceClient();

    const { data: document, error: docError } = await supabase
      .from('einvoice_documents')
      .select('*')
      .eq('document_id', document_id)
      .eq('tenant_id', tenant_id)
      .single();

    if (docError || !document) {
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const evaluationContext = {
      ...context,
      document_id: document.document_id,
      format: document.format,
      status: document.status,
      confidence_score: document.confidence_score,
      total_amount: document.total_amount,
      currency: document.currency,
      country_code: document.country_code,
      sender_id: document.sender_id,
      receiver_id: document.receiver_id,
      issue_date: document.issue_date,
      due_date: document.due_date,
      created_at: document.created_at
    };

    const { data: policies, error: policyError } = await supabase
      .from('einvoice_policies')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('is_active', true)
      .in('policy_type', policy_types)
      .order('priority', { ascending: true });

    if (policyError) {
      console.error('Failed to fetch policies:', policyError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch policies' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const stringExpressionPolicy = (policies || []).find((policy: any) => hasStringExpression(policy.conditions || {}));
    if (stringExpressionPolicy) {
      await serviceSupabase.from('audit_logs').insert({
        entity_type: 'policy_evaluation',
        entity_id: document.id,
        action: 'POLICY_STRING_EXPRESSION_REJECTED',
        event_type: 'policy_rejected',
        metadata: { reason: 'string_expression' },
        user_id: user.id,
        new_values: { policy_id: stringExpressionPolicy.id, policy_name: stringExpressionPolicy.policy_name },
        ip_address: req.headers.get('x-forwarded-for')?.split(',')[0],
        user_agent: req.headers.get('user-agent')
      });

      return new Response(JSON.stringify({
        error: 'String expressions are not allowed in policy conditions',
        policy_id: stringExpressionPolicy.id,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: PolicyEvaluationResult[] = [];
    const triggeredPolicies: any[] = [];
    const beforeState = { ...document };

    for (const policy of policies || []) {
      const result = evaluatePolicy(policy, evaluationContext);
      results.push(result);

      if (result.triggered) {
        triggeredPolicies.push(policy);
      }
    }

    let finalDecision = 'approved';
    const executedActions: any[] = [];

    // Collect batch operations
    const reviewQueueInserts: any[] = [];
    const fraudFlagInserts: any[] = [];
    let finalStatusUpdate: string | null = null;

    for (const policy of triggeredPolicies) {
      for (const action of policy.actions || []) {
        switch (action.type) {
          case 'block_approval':
            finalDecision = 'blocked';
            executedActions.push({ policy: policy.policy_name, action: 'blocked_approval' });
            break;
          case 'require_manual_review':
            finalDecision = 'requires_review';
            reviewQueueInserts.push({
              invoice_id: document.id,
              reason: `Policy triggered: ${policy.policy_name}`,
              priority: action.priority || 3,
              flagged_fields: { policy_triggered: true, policy_name: policy.policy_name }
            });
            executedActions.push({ policy: policy.policy_name, action: 'routed_to_review' });
            break;
          case 'flag_for_fraud':
            fraudFlagInserts.push({
              document_id: document.id,
              flag_type: action.flag_type || 'vendor_mismatch',
              risk_score: action.risk_score || 50,
              details: { policy_triggered: policy.policy_name, ...action.details },
              tenant_id: tenant_id
            });
            executedActions.push({ policy: policy.policy_name, action: 'flagged_for_fraud' });
            break;
          case 'update_status':
            finalStatusUpdate = action.new_status;
            executedActions.push({ policy: policy.policy_name, action: 'status_updated', new_status: action.new_status });
            break;
        }
      }
    }

    // Execute batch operations
    const promises = [];

    if (reviewQueueInserts.length > 0) {
      promises.push(serviceSupabase.from('review_queue').insert(reviewQueueInserts));
    }

    if (fraudFlagInserts.length > 0) {
      promises.push(serviceSupabase.from('fraud_flags_einvoice').insert(fraudFlagInserts));
    }

    if (finalStatusUpdate) {
      promises.push(
        serviceSupabase
          .from('einvoice_documents')
          .update({ status: finalStatusUpdate })
          .eq('id', document.id)
      );
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }

    const { data: afterDocument } = await supabase
      .from('einvoice_documents')
      .select('*')
      .eq('id', document.id)
      .single();

    const diff = calculateDiff(beforeState, afterDocument || document);

    await serviceSupabase.from('audit_logs').insert({
      entity_type: 'policy_evaluation',
      entity_id: document.id,
      action: 'POLICY_EVALUATION',
      event_type: 'policy_evaluation',
      metadata: { final_decision: finalDecision, triggered_policies: triggeredPolicies.length },
      user_id: user.id,
      old_values: beforeState,
      new_values: afterDocument || document,
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0],
      user_agent: req.headers.get('user-agent')
    });

    await serviceSupabase.from('model_stats').insert({
      tenant_id: tenant_id,
      model: 'policy_engine',
      stage: 'evaluation',
      confidence: results.filter(r => r.triggered).length / Math.max(1, results.length),
      payload: {
        document_id,
        policies_evaluated: results.length,
        policies_triggered: triggeredPolicies.length,
        final_decision: finalDecision
      }
    });

    const response = {
      document_id,
      evaluation_results: results,
      triggered_policies: triggeredPolicies.length,
      final_decision: finalDecision,
      executed_actions: executedActions,
      state_diff: diff,
      evaluated_at: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Policy engine error:', error);
    if (error instanceof Error && (error.message === 'Forbidden' || error.message === 'Unauthorized')) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.message === 'Forbidden' ? 403 : 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      error: 'Policy evaluation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
