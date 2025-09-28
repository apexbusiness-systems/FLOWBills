import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP
const rateLimitStore = new Map<string, number[]>();

// Enhanced rate limiting function
function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const requests = rateLimitStore.get(clientIp) || [];
  
  // Remove old requests outside the window
  const validRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (validRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  validRequests.push(now);
  rateLimitStore.set(clientIp, validRequests);
  return true;
}

// Enhanced input validation with security checks
function validateInputSecurity(input: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for potential XSS/injection attempts
  const suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /'(\s*union\s+select|;\s*drop\s+table)/gi
  ];
  
  const inputString = JSON.stringify(input);
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(inputString)) {
      errors.push(`Potential security threat detected: ${pattern.source}`);
    }
  }
  
  // Check for oversized payloads
  if (inputString.length > 50000) { // 50KB limit
    errors.push('Request payload too large');
  }
  
  return { valid: errors.length === 0, errors };
}

interface InvoiceAnalysis {
  invoice_id: string;
  confidence_score: number;
  extracted_data: Record<string, any>;
  risk_factors: string[];
  amount: number;
  vendor_id?: string;
}

// Enhanced input validation schema
const validateInput = (input: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!input || typeof input !== 'object') {
    errors.push('Invalid input format');
    return { valid: false, errors };
  }
  
  // Validate required fields
  if (!input.invoice_id || typeof input.invoice_id !== 'string') {
    errors.push('Invalid or missing invoice_id');
  }
  
  if (typeof input.confidence_score !== 'number' || input.confidence_score < 0 || input.confidence_score > 100) {
    errors.push('Invalid confidence_score (must be number between 0-100)');
  }
  
  if (typeof input.amount !== 'number' || input.amount < 0) {
    errors.push('Invalid amount (must be positive number)');
  }
  
  // Sanitize risk factors
  if (input.risk_factors && !Array.isArray(input.risk_factors)) {
    errors.push('Invalid risk_factors (must be array)');
  }
  
  return { valid: errors.length === 0, errors };
};

serve(async (req) => {
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

    // Get client IP and user agent for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Rate limiting check
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .rpc('check_rate_limit', {
        identifier: clientIP,
        action_type: 'hil_routing',
        max_requests: 100, // 100 requests per hour
        window_minutes: 60
      });
    
    if (rateLimitError || !rateLimitData) {
      console.warn('Rate limit exceeded for IP:', clientIP);
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Please try again later.',
        routing_decision: 'human_review',
        requires_human_review: true
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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