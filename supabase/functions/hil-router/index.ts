import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Type definitions
interface InvoiceAnalysis {
  invoice_id: string;
  confidence_score: number;
  amount: number;
  risk_factors?: string[];
  extracted_data?: Record<string, any>;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Rate limiting
const RATE_LIMIT_MAP = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = { maxRequests: 100, windowMs: 60000 }; // 100 requests per minute

function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const record = RATE_LIMIT_MAP.get(clientIp);

  if (!record || now > record.resetTime) {
    RATE_LIMIT_MAP.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return true;
  }

  if (record.count >= RATE_LIMIT.maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// Input validation with enhanced security checks
const validateInput = (invoice: InvoiceAnalysis): ValidationResult => {
  const errors: string[] = [];

  if (!invoice) {
    errors.push('Invoice data is required');
    return { valid: false, errors };
  }

  if (!invoice.invoice_id || typeof invoice.invoice_id !== 'string') {
    errors.push('Valid invoice_id is required');
  }

  if (typeof invoice.confidence_score !== 'number' || 
      invoice.confidence_score < 0 || 
      invoice.confidence_score > 100) {
    errors.push('confidence_score must be a number between 0 and 100');
  }

  if (typeof invoice.amount !== 'number' || invoice.amount < 0) {
    errors.push('amount must be a positive number');
  }

  // Prevent excessive data size (max 100KB)
  const dataSize = JSON.stringify(invoice).length;
  if (dataSize > 100000) {
    errors.push('Invoice data exceeds maximum size limit');
  }

  return { valid: errors.length === 0, errors };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    if (!checkRateLimit(clientIp)) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get client IP and user agent for logging
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const requestBody = await req.json();
    const { invoice } = requestBody as { invoice: InvoiceAnalysis };
    
    // Enhanced input validation
    const validation = validateInput(invoice);
    if (!validation.valid) {
      console.error('Input validation failed:', validation.errors);
      
      // Log security event for invalid input
      await supabase.from('security_events').insert({
        event_type: 'invalid_input_hil_router',
        severity: 'medium',
        details: {
          errors: validation.errors,
          ip_address: clientIP,
          user_agent: userAgent,
          input_sample: JSON.stringify(invoice).substring(0, 500)
        }
      });
      
      return new Response(JSON.stringify({ 
        error: 'Invalid input data',
        details: validation.errors,
        routing_decision: 'human_review',
        requires_human_review: true
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
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
      // Get user_id from invoice
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('user_id')
        .eq('id', invoice.invoice_id)
        .single();
      
      if (invoiceData?.user_id) {
        const { error: queueError } = await supabase
          .from('review_queue')
          .insert({
            invoice_id: invoice.invoice_id,
            assigned_to: invoiceData.user_id, // Use assigned_to instead of user_id
            reason: reason,
            confidence_score: invoice.confidence_score,
            flagged_fields: flaggedFields.length > 0 ? flaggedFields : [] // Use flagged_fields instead of risk_factors
          });

        if (queueError) {
          console.error('Error adding to review queue:', queueError);
        } else {
          console.log('Invoice added to review queue:', invoice.invoice_id);
        }
      }
    }

    // Update invoice status (confidence_score is stored in invoice_extractions, not invoices)
    const newStatus = routingDecision === 'auto_approve' ? 'approved' : 'processing';
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ status: newStatus })
      .eq('id', invoice.invoice_id);

    if (updateError) {
      console.error('Error updating invoice status:', updateError);
    }

    // Create approval record for auto-approved invoices
    if (routingDecision === 'auto_approve') {
      // Get user_id from invoice for the approval record
      const { data: invData } = await supabase
        .from('invoices')
        .select('user_id')
        .eq('id', invoice.invoice_id)
        .single();
      
      if (invData?.user_id) {
        const { error: approvalError } = await supabase
          .from('approvals')
          .insert({
            invoice_id: invoice.invoice_id,
            approver_id: invData.user_id, // Use approver_id instead of user_id
            status: 'approved', // Use status instead of approval_status
            amount_approved: invoice.amount,
            approval_date: new Date().toISOString(),
            comments: 'Auto-approved by HIL router',
            auto_approved: true
          });

        if (approvalError) {
          console.error('Error creating approval record:', approvalError);
        }
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
