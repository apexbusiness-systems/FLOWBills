import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface InvoiceAnalysis {
  invoice_id: string;
  confidence_score: number;
  extracted_data: Record<string, any>;
  risk_factors: string[];
  amount: number;
  vendor_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { invoice } = await req.json() as { invoice: InvoiceAnalysis };
    
    console.log('HIL routing for invoice:', invoice.invoice_id);

    // Define confidence thresholds
    const AUTO_APPROVE_THRESHOLD = 85;
    const REQUIRE_REVIEW_THRESHOLD = 60;
    const HIGH_VALUE_THRESHOLD = 10000; // CAD $10,000

    let routingDecision = 'auto_approve';
    let reason = 'High confidence score';
    let priority = 3; // Low priority
    const flaggedFields: string[] = [];

    // Check confidence score
    if (invoice.confidence_score < REQUIRE_REVIEW_THRESHOLD) {
      routingDecision = 'human_review';
      reason = 'Low confidence score';
      priority = 2; // Medium priority
      flaggedFields.push('confidence_score');
    } else if (invoice.confidence_score < AUTO_APPROVE_THRESHOLD) {
      routingDecision = 'human_review';
      reason = 'Medium confidence score requires review';
      priority = 3; // Low priority
      flaggedFields.push('confidence_score');
    }

    // High-value invoices require review regardless of confidence
    if (invoice.amount >= HIGH_VALUE_THRESHOLD) {
      routingDecision = 'human_review';
      reason = `High value invoice (${invoice.amount} CAD) requires review`;
      priority = 1; // High priority
      flaggedFields.push('amount');
    }

    // Check for risk factors
    if (invoice.risk_factors && invoice.risk_factors.length > 0) {
      routingDecision = 'human_review';
      reason = `Risk factors detected: ${invoice.risk_factors.join(', ')}`;
      priority = Math.min(priority, 2); // At least medium priority
      flaggedFields.push(...invoice.risk_factors);
    }

    // Check for missing critical data
    const criticalFields = ['vendor_id', 'amount', 'invoice_date'];
    const missingFields = criticalFields.filter(field => 
      !invoice.extracted_data || !invoice.extracted_data[field]
    );

    if (missingFields.length > 0) {
      routingDecision = 'human_review';
      reason = `Missing critical fields: ${missingFields.join(', ')}`;
      priority = 2; // Medium priority
      flaggedFields.push(...missingFields);
    }

    // Create routing result
    const result = {
      invoice_id: invoice.invoice_id,
      routing_decision: routingDecision,
      reason: reason,
      priority: priority,
      flagged_fields: flaggedFields,
      confidence_score: invoice.confidence_score,
      requires_human_review: routingDecision === 'human_review'
    };

    // If requires human review, add to review queue
    if (routingDecision === 'human_review') {
      const { error: queueError } = await supabase
        .from('review_queue')
        .insert({
          invoice_id: invoice.invoice_id,
          priority: priority,
          reason: reason,
          confidence_score: invoice.confidence_score,
          flagged_fields: flaggedFields
        });

      if (queueError) {
        console.error('Error adding to review queue:', queueError);
      } else {
        console.log('Invoice added to review queue:', invoice.invoice_id);
      }
    }

    // Update invoice status
    const newStatus = routingDecision === 'auto_approve' ? 'approved' : 'processing';
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ 
        status: newStatus,
        confidence_score: invoice.confidence_score
      })
      .eq('id', invoice.invoice_id);

    if (updateError) {
      console.error('Error updating invoice status:', updateError);
    }

    // Create approval record for auto-approved invoices
    if (routingDecision === 'auto_approve') {
      const { error: approvalError } = await supabase
        .from('approvals')
        .insert({
          invoice_id: invoice.invoice_id,
          status: 'approved',
          amount_approved: invoice.amount,
          approval_date: new Date().toISOString(),
          comments: 'Auto-approved by HIL router',
          auto_approved: true
        });

      if (approvalError) {
        console.error('Error creating approval record:', approvalError);
      }
    }

    console.log('HIL routing result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('HIL routing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      routing_decision: 'human_review',
      reason: 'Error in automated processing',
      requires_human_review: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});