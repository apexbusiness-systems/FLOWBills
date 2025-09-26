import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { toMessage } from "../_shared/errors.ts";

type Vendor = { bank_account?: string | null };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PolicyRequest {
  invoice_id: string;
  invoice_data: {
    amount: number;
    vendor_id?: string;
    confidence_score?: number;
    extracted_data?: any;
  };
  policy_types?: string[];
}

interface PolicyResult {
  policy_id: string;
  policy_name: string;
  triggered: boolean;
  actions: any;
  details?: string;
}

interface PolicyEngineResponse {
  success: boolean;
  invoice_id: string;
  policies_evaluated: PolicyResult[];
  final_decision: 'auto_approve' | 'require_approval' | 'flag_for_review' | 'block';
  required_approvals: number;
  routing_reason: string;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { invoice_id, invoice_data, policy_types = ['approval', 'fraud'] }: PolicyRequest = await req.json();
    
    console.log(`Evaluating policies for invoice ${invoice_id}, amount: ${invoice_data.amount}`);

    // Fetch active policies
    const { data: policies, error: policiesError } = await supabase
      .from('policies')
      .select('*')
      .eq('is_active', true)
      .in('policy_type', policy_types)
      .order('priority', { ascending: true });

    if (policiesError) {
      throw new Error(`Failed to fetch policies: ${policiesError.message}`);
    }

    const evaluationResults: PolicyResult[] = [];
    let requiredApprovals = 0;
    let finalDecision: PolicyEngineResponse['final_decision'] = 'auto_approve';
    let routingReason = 'All policies passed, auto-approving';

    // Evaluate each policy
    for (const policy of policies) {
      const result = await evaluatePolicy(policy, invoice_data, supabase);
      evaluationResults.push(result);

      if (result.triggered) {
        console.log(`Policy triggered: ${policy.policy_name}`);
        
        // Apply policy actions
        const actions = result.actions;
        
        if (actions.require_approvals) {
          requiredApprovals = Math.max(requiredApprovals, actions.require_approvals);
          finalDecision = 'require_approval';
          routingReason = `Policy "${policy.policy_name}" requires ${actions.require_approvals} approvals`;
        }
        
        if (actions.flag_for_review) {
          finalDecision = 'flag_for_review';
          routingReason = `Policy "${policy.policy_name}" flagged for manual review`;
        }
        
        if (actions.block_processing) {
          finalDecision = 'block';
          routingReason = `Policy "${policy.policy_name}" blocked processing`;
          break; // Stop evaluation if blocked
        }

        // Create fraud flags if needed
        if (actions.create_fraud_flag) {
          await supabase.from('fraud_flags').insert({
            entity_type: 'invoice',
            entity_id: invoice_id,
            flag_type: actions.create_fraud_flag,
            risk_score: actions.risk_score || 50,
            details: { policy_id: policy.id, triggered_by: policy.policy_name }
          });
        }
      }
    }

    // Update invoice with policy results
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        approval_policy_id: policies.find(p => p.policy_type === 'approval')?.id,
        status: finalDecision === 'auto_approve' ? 'approved' : 'pending_approval'
      })
      .eq('id', invoice_id);

    if (updateError) {
      console.error('Failed to update invoice:', updateError);
    }

    // Create approval records if needed
    if (finalDecision === 'require_approval' && requiredApprovals > 0) {
      for (let i = 0; i < requiredApprovals; i++) {
        await supabase.from('approvals').insert({
          invoice_id,
          approval_level: i + 1,
          status: 'pending',
          amount_approved: invoice_data.amount
        });
      }
    }

    // Add to review queue if flagged
    if (finalDecision === 'flag_for_review') {
      await supabase.from('review_queue').insert({
        invoice_id,
        reason: routingReason,
        priority: 3,
        confidence_score: invoice_data.confidence_score || 0,
        flagged_fields: { policies_triggered: evaluationResults.filter(r => r.triggered).map(r => r.policy_name) }
      });
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      action: 'POLICY_EVALUATION',
      entity_type: 'invoice',
      entity_id: invoice_id,
      new_values: {
        decision: finalDecision,
        required_approvals: requiredApprovals,
        policies_triggered: evaluationResults.filter(r => r.triggered).length
      },
      user_id: null // System action
    });

    const response: PolicyEngineResponse = {
      success: true,
      invoice_id,
      policies_evaluated: evaluationResults,
      final_decision: finalDecision,
      required_approvals: requiredApprovals,
      routing_reason: routingReason
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    console.error('Policy engine error:', err);
    
    const errorResponse: PolicyEngineResponse = {
      success: false,
      invoice_id: '',
      policies_evaluated: [],
      final_decision: 'block',
      required_approvals: 0,
      routing_reason: 'Policy engine error',
      error: toMessage(err)
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function evaluatePolicy(policy: any, invoiceData: any, supabase: any): Promise<PolicyResult> {
  const conditions = policy.conditions;
  const actions = policy.actions;
  
  let triggered = false;
  let details = '';

  try {
    // Evaluate approval policies
    if (policy.policy_type === 'approval') {
      if (conditions.amount_threshold && invoiceData.amount > conditions.amount_threshold) {
        triggered = true;
        details = `Amount ${invoiceData.amount} exceeds threshold ${conditions.amount_threshold}`;
      }
    }

    // Evaluate fraud policies
    if (policy.policy_type === 'fraud') {
      if (conditions.check_bank_duplicates && invoiceData.vendor_id) {
        // Check for duplicate bank accounts across vendors using safe queries
        const { data: vendors } = await supabase
          .from('vendors')
          .select('bank_account, id')
          .neq('id', invoiceData.vendor_id)
          .not('bank_account', 'is', null);

        const { data: list } = await supabase.from("vendors").select("bank_account").eq("id", invoiceData.vendor_id).limit(1);
        const target = list?.[0]?.bank_account ?? null;
        const vendorList: Vendor[] = vendors ?? [];
        const duplicates = vendorList.filter((v: Vendor) => v.bank_account != null && v.bank_account === target);

        if (duplicates && duplicates.length > 0) {
          triggered = true;
          details = `Bank account shared with ${duplicates.length} other vendors`;
        }
      }

      if (conditions.check_tax_id_duplicates && invoiceData.vendor_id) {
        // Similar check for tax ID duplicates
        // Implementation would be similar to bank account check
      }
    }

  } catch (err: unknown) {
    console.error(`Error evaluating policy ${policy.policy_name}:`, err);
  }

  return {
    policy_id: policy.id,
    policy_name: policy.policy_name,
    triggered,
    actions: triggered ? actions : {},
    details: triggered ? details : undefined
  };
}