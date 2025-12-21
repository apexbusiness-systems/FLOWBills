/**
 * FlowC Webhook Handler
 * 
 * Receives compliance check results from FlowC when invoices are processed.
 * This is the endpoint that FlowC calls to notify FLOWBills of compliance decisions.
 * 
 * Endpoint: POST /functions/v1/flowc-webhook
 * Custom Domain: https://flowbills.ca/api/flowc/webhook (requires Supabase custom domain routing)
 * 
 * Security: Validates HMAC signature from FlowC using FLOWBILLS_WEBHOOK_SECRET
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface FlowCWebhookPayload {
  invoice_id: string;
  action: 'HOLD' | 'ROUTE_TO_REVIEW' | 'CLEAR';
  compliance_code: string;
  risk_score: number;
  details: string;
  timestamp: string;
}

/**
 * Verify HMAC signature from FlowC
 */
async function verifySignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payload);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const signatureHex = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Constant-time comparison
    if (signatureHex.length !== signature.length) {
      return false;
    }

    let match = 0;
    for (let i = 0; i < signatureHex.length; i++) {
      match |= signatureHex.charCodeAt(i) ^ signature.charCodeAt(i);
    }

    return match === 0;
  } catch (error) {
    console.error('[FlowC Webhook] Signature verification error:', error);
    return false;
  }
}

/**
 * Handle HOLD action - pause invoice payment processing
 */
async function handleHold(
  supabase: ReturnType<typeof createClient>,
  invoiceId: string,
  complianceCode: string,
  details: string
): Promise<void> {
  // Update invoice status to paused
  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      status: 'on_hold',
      notes: `FlowC compliance hold: ${complianceCode}. ${details}`
    })
    .eq('id', invoiceId);

  if (updateError) {
    console.error('[FlowC Webhook] Failed to update invoice status:', updateError);
    throw updateError;
  }

  // Add to review queue if not already there
  const { data: existingQueue } = await supabase
    .from('review_queue')
    .select('id')
    .eq('invoice_id', invoiceId)
    .single();

  if (!existingQueue) {
    // Get invoice user_id
    const { data: invoice } = await supabase
      .from('invoices')
      .select('user_id')
      .eq('id', invoiceId)
      .single();

    if (invoice?.user_id) {
      await supabase
        .from('review_queue')
        .insert({
          invoice_id: invoiceId,
          user_id: invoice.user_id,
          priority: 1, // High priority for compliance holds
          reason: `FlowC compliance hold: ${complianceCode}`,
          flagged_fields: ['compliance_hold']
        });
    }
  }

  // Log security event
  await supabase.from('security_events').insert({
    event_type: 'flowc_compliance_hold',
    severity: 'high',
    details: {
      invoice_id: invoiceId,
      compliance_code: complianceCode,
      details: details
    }
  });
}

/**
 * Handle ROUTE_TO_REVIEW action - route invoice to manual review
 */
async function handleRouteToReview(
  supabase: ReturnType<typeof createClient>,
  invoiceId: string,
  complianceCode: string,
  details: string
): Promise<void> {
  // Get invoice user_id
  const { data: invoice } = await supabase
    .from('invoices')
    .select('user_id')
    .eq('id', invoiceId)
    .single();

  if (!invoice?.user_id) {
    throw new Error('Invoice not found');
  }

  // Add to review queue
  const { data: existingQueue } = await supabase
    .from('review_queue')
    .select('id')
    .eq('invoice_id', invoiceId)
    .single();

  if (!existingQueue) {
    await supabase
      .from('review_queue')
      .insert({
        invoice_id: invoiceId,
        user_id: invoice.user_id,
        priority: 2, // Medium priority
        reason: `FlowC compliance review: ${complianceCode}`,
        flagged_fields: ['compliance_review']
      });
  }

  // Update invoice status
  await supabase
    .from('invoices')
    .update({
      status: 'needs_review',
      notes: `FlowC compliance review: ${complianceCode}. ${details}`
    })
    .eq('id', invoiceId);
}

/**
 * Handle CLEAR action - remove hold and resume processing
 */
async function handleClear(
  supabase: ReturnType<typeof createClient>,
  invoiceId: string
): Promise<void> {
  // Update invoice status back to processing
  await supabase
    .from('invoices')
    .update({
      status: 'processing',
      notes: 'FlowC compliance clear - resuming processing'
    })
    .eq('id', invoiceId);

  // Remove from review queue if it was added for compliance
  await supabase
    .from('review_queue')
    .delete()
    .eq('invoice_id', invoiceId)
    .contains('flagged_fields', ['compliance_hold', 'compliance_review']);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Extract signature header
    const signature = req.headers.get('x-flowc-signature');
    const webhookSecret = Deno.env.get('FLOWBILLS_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      console.error('[FlowC Webhook] Missing signature or secret');
      return new Response(
        JSON.stringify({ error: 'Missing authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get raw body for signature verification
    const rawBody = await req.text();
    const payload: FlowCWebhookPayload = JSON.parse(rawBody);

    // Verify signature
    const isValid = await verifySignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.error('[FlowC Webhook] Invalid signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[FlowC Webhook] Processing ${payload.action} for invoice ${payload.invoice_id}`);

    // Handle action
    switch (payload.action) {
      case 'HOLD':
        await handleHold(supabase, payload.invoice_id, payload.compliance_code, payload.details);
        break;

      case 'ROUTE_TO_REVIEW':
        await handleRouteToReview(supabase, payload.invoice_id, payload.compliance_code, payload.details);
        break;

      case 'CLEAR':
        await handleClear(supabase, payload.invoice_id);
        break;

      default:
        console.error(`[FlowC Webhook] Unknown action: ${payload.action}`);
        return new Response(
          JSON.stringify({ error: `Unknown action: ${payload.action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({
        received: true,
        invoice_id: payload.invoice_id,
        action: payload.action,
        processed_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[FlowC Webhook] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

