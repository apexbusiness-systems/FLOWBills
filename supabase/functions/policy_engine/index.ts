import { createClient } from "npm:@supabase/supabase-js@2.58.0"
import { corsHeaders } from '../_shared/cors.ts'
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

// Input validation schema
const PolicyRequestSchema = z.object({
  document_id: z.string().min(1, "Document ID is required"),
  policy_types: z.array(z.enum(['validation', 'approval', 'routing', 'fraud'])).optional(),
  context: z.record(z.any()).optional().default({}),
});

interface PolicyEvaluationResult {
  policy_id: string;
  policy_name: string;
  triggered: boolean;
  actions: any[];
  details?: any;
}

// Simple expression evaluator (replace with proper CEL or similar)
function evaluateExpression(expression: string, context: any): boolean {
  try {
    // Simple expressions like "amount > 1000" or "country_code == 'DE'"
    // WARNING: This is a simplified implementation. Use a proper expression evaluator in production.
    
    // Replace context variables
    let evaluableExpr = expression;
    for (const [key, value] of Object.entries(context)) {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      if (typeof value === 'string') {
        evaluableExpr = evaluableExpr.replace(regex, `"${value}"`);
      } else {
        evaluableExpr = evaluableExpr.replace(regex, String(value));
      }
    }

    // Simple evaluation - CAUTION: Only use with sanitized expressions
    // In production, use a proper expression evaluator library
    if (evaluableExpr.includes('&&') || evaluableExpr.includes('||')) {
      // Handle boolean operators
      return eval(evaluableExpr);
    }
    
    // Handle simple comparisons
    if (evaluableExpr.includes('>=')) {
      const [left, right] = evaluableExpr.split('>=').map(s => s.trim());
      return parseFloat(eval(left)) >= parseFloat(eval(right));
    }
    if (evaluableExpr.includes('<=')) {
      const [left, right] = evaluableExpr.split('<=').map(s => s.trim());
      return parseFloat(eval(left)) <= parseFloat(eval(right));
    }
    if (evaluableExpr.includes('>')) {
      const [left, right] = evaluableExpr.split('>').map(s => s.trim());
      return parseFloat(eval(left)) > parseFloat(eval(right));
    }
    if (evaluableExpr.includes('<')) {
      const [left, right] = evaluableExpr.split('<').map(s => s.trim());
      return parseFloat(eval(left)) < parseFloat(eval(right));
    }
    if (evaluableExpr.includes('==')) {
      const [left, right] = evaluableExpr.split('==').map(s => s.trim());
      return eval(left) === eval(right);
    }
    if (evaluableExpr.includes('!=')) {
      const [left, right] = evaluableExpr.split('!=').map(s => s.trim());
      return eval(left) !== eval(right);
    }

    return false;
  } catch (error) {
    console.error('Expression evaluation error:', error);
    return false;
  }
}

// Evaluate a single policy against document context
function evaluatePolicy(policy: any, context: any): PolicyEvaluationResult {
  const conditions = policy.conditions || {};
  const actions = policy.actions || [];
  
  let triggered = true;
  const details: any = {};

  // Evaluate each condition
  for (const [conditionKey, conditionValue] of Object.entries(conditions)) {
    if (typeof conditionValue === 'string') {
      // Expression-based condition
      const result = evaluateExpression(conditionValue, context);
      details[conditionKey] = { expression: conditionValue, result };
      if (!result) {
        triggered = false;
      }
    } else if (typeof conditionValue === 'object' && conditionValue !== null) {
      // Object-based conditions
      const condition = conditionValue as any;
      
      if (condition.field && condition.operator && condition.value !== undefined) {
        const fieldValue = context[condition.field];
        let conditionMet = false;
        
        switch (condition.operator) {
          case '>':
            conditionMet = fieldValue > condition.value;
            break;
          case '<':
            conditionMet = fieldValue < condition.value;
            break;
          case '>=':
            conditionMet = fieldValue >= condition.value;
            break;
          case '<=':
            conditionMet = fieldValue <= condition.value;
            break;
          case '==':
            conditionMet = fieldValue === condition.value;
            break;
          case '!=':
            conditionMet = fieldValue !== condition.value;
            break;
          case 'contains':
            conditionMet = String(fieldValue).includes(String(condition.value));
            break;
          case 'matches':
            conditionMet = new RegExp(condition.value).test(String(fieldValue));
            break;
          default:
            conditionMet = false;
        }
        
        details[conditionKey] = {
          field: condition.field,
          operator: condition.operator,
          expected: condition.value,
          actual: fieldValue,
          result: conditionMet
        };
        
        if (!conditionMet) {
          triggered = false;
        }
      }
    }
  }

  return {
    policy_id: policy.id,
    policy_name: policy.policy_name,
    triggered,
    actions: triggered ? actions : [],
    details
  };
}

// Calculate diff between before/after states
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse and validate request
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

    const { document_id, policy_types = ['validation', 'approval', 'routing', 'fraud'], context } = parsed.data;
    const tenantId = body.tenant_id || 'system';

    // Get document data for context
    const { data: document, error: docError } = await supabase
      .from('einvoice_documents')
      .select('*')
      .eq('document_id', document_id)
      .eq('tenant_id', tenantId)
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

    // Build evaluation context
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

    // Fetch active policies for the tenant
    const { data: policies, error: policyError } = await supabase
      .from('einvoice_policies')
      .select('*')
      .eq('tenant_id', tenantId)
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

    // Evaluate each policy
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

    // Execute actions from triggered policies
    let finalDecision = 'approved';
    const executedActions: any[] = [];
    
    for (const policy of triggeredPolicies) {
      for (const action of policy.actions || []) {
        switch (action.type) {
          case 'block_approval':
            finalDecision = 'blocked';
            executedActions.push({ policy: policy.policy_name, action: 'blocked_approval' });
            break;
          case 'require_manual_review':
            finalDecision = 'requires_review';
            // Add to review queue
            await supabase.from('review_queue').insert({
              invoice_id: document.id,
              reason: `Policy triggered: ${policy.policy_name}`,
              priority: action.priority || 3,
              flagged_fields: { policy_triggered: true, policy_name: policy.policy_name }
            });
            executedActions.push({ policy: policy.policy_name, action: 'routed_to_review' });
            break;
          case 'flag_for_fraud':
            await supabase.from('fraud_flags_einvoice').insert({
              document_id: document.id,
              flag_type: action.flag_type || 'vendor_mismatch',
              risk_score: action.risk_score || 50,
              details: { policy_triggered: policy.policy_name, ...action.details },
              tenant_id: tenantId
            });
            executedActions.push({ policy: policy.policy_name, action: 'flagged_for_fraud' });
            break;
          case 'update_status':
            await supabase
              .from('einvoice_documents')
              .update({ status: action.new_status })
              .eq('id', document.id);
            executedActions.push({ policy: policy.policy_name, action: 'status_updated', new_status: action.new_status });
            break;
        }
      }
    }

    // Get updated document state for diff calculation
    const { data: afterDocument } = await supabase
      .from('einvoice_documents')
      .select('*')
      .eq('id', document.id)
      .single();

    const diff = calculateDiff(beforeState, afterDocument || document);

    // Log policy evaluation
    await supabase.from('audit_logs').insert({
      entity_type: 'policy_evaluation',
      entity_id: document.id,
      action: 'POLICY_EVALUATION',
      user_id: tenantId,
      old_values: beforeState,
      new_values: afterDocument || document,
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0],
      user_agent: req.headers.get('user-agent')
    });

    // Increment metrics
    await supabase.from('model_stats').insert({
      tenant_id: tenantId,
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
    return new Response(JSON.stringify({ 
      error: 'Policy evaluation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});