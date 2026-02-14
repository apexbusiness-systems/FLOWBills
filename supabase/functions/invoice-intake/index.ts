import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const InvoiceIntakeSchema = z.object({
  invoice_id: z.string().min(1, "Invoice ID is required"),
  file_content: z.string().min(1, "File content is required"),
});

/**
 * Invoice Intake Orchestration Function
 * 
 * This function orchestrates the complete invoice processing pipeline:
 * 1. Extract invoice data using AI
 * 2. Run duplicate detection
 * 3. Validate against AFE budget
 * 4. Route for approval based on amount thresholds
 * 5. Create review queue entries if needed
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authToken = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authToken) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate request body
    const body = await req.json();
    const validationResult = InvoiceIntakeSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(JSON.stringify({
        error: 'Validation failed',
        details: validationResult.error.errors
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { invoice_id, file_content } = validationResult.data;

    console.log(`Starting invoice intake for invoice ${invoice_id}`);

    // ==================================================================
    // STEP 1: Extract invoice data using AI
    // ==================================================================
    console.log('Step 1: Extracting invoice data...');
    
    const { data: extractResult, error: extractError } = await supabase.functions.invoke('invoice-extract', {
      body: { invoice_id, file_content },
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (extractError) {
      console.error('Extraction error:', extractError);
      throw new Error(`Extraction failed: ${extractError.message}`);
    }

    if (!extractResult.success) {
      throw new Error(extractResult.error || 'Extraction failed');
    }

    console.log('Extraction complete:', extractResult);

    // ==================================================================
    // STEP 2: Run duplicate detection
    // ==================================================================
    console.log('Step 2: Running duplicate detection...');
    
    // Fetch invoice details for duplicate check
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoice_id)
      .single();

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Run duplicate check
    const { data: dupResult, error: dupError } = await supabase.functions.invoke('duplicate-check', {
      body: {
        invoice_number: invoice.invoice_number,
        vendor_id: invoice.vendor_name, // Using vendor_name as ID for now
        amount_cents: Math.round(invoice.amount * 100),
        invoice_date: invoice.invoice_date,
        po_number: extractResult.extracted_data?.po_number || null,
      }
    });

    if (dupError) {
      console.error('Duplicate check error:', dupError);
      // Continue even if duplicate check fails
    }

    console.log('Duplicate check result:', dupResult);

    // ==================================================================
    // STEP 3: Run HIL Router for intelligent routing
    // ==================================================================
    console.log('Step 3: Running HIL router for intelligent routing...');
    
    // Get confidence score from extraction
    const confidenceScore = extractResult.extracted_data?.confidence_scores?.overall || 
                           extractResult.extracted_data?.confidence_score || 
                           85; // Default to high confidence if not provided
    
    // Prepare risk factors for HIL router
    const riskFactors: string[] = [];
    if (dupResult?.is_exact_duplicate) {
      riskFactors.push('duplicate_detected');
    }
    if (extractResult.validation_errors?.length > 0) {
      riskFactors.push('validation_errors');
    }
    if (extractResult.budget_status === 'over_budget') {
      riskFactors.push('budget_exceeded');
    }
    
    // Call HIL router for intelligent routing decision
    let routingDecision = 'auto_approve';
    let requiresReview = false;
    let reviewReason = '';
    let hilResult: any = null;
    let hilError: any = null;
    
    try {
      const { data: result, error: error } = await supabase.functions.invoke('hil-router', {
        body: {
          invoice: {
            invoice_id,
            confidence_score: confidenceScore,
            amount: invoice.amount,
            risk_factors: riskFactors,
            extracted_data: extractResult.extracted_data
          }
        }
      });
      
      hilResult = result;
      hilError = error;
      
      if (hilError) {
        console.warn('HIL router error (continuing with fallback logic):', hilError);
        // Fall back to simple logic if HIL router fails
      } else if (hilResult) {
        routingDecision = hilResult.routing_decision || 'auto_approve';
        requiresReview = hilResult.requires_human_review || false;
        reviewReason = hilResult.reason || '';
        console.log('HIL router decision:', routingDecision, 'requiresReview:', requiresReview);
      }
    } catch (error) {
      hilError = error;
      console.warn('HIL router call failed (continuing with fallback logic):', error);
      // Fall back to simple logic if HIL router fails
    }
    
    // Fallback logic if HIL router didn't provide decision
    if (!hilResult || hilError) {
      // Check for duplicates
      if (dupResult?.is_exact_duplicate) {
        routingDecision = 'human_review';
        requiresReview = true;
        reviewReason = 'Exact duplicate detected';
      } else if (dupResult?.potential_duplicates?.length > 0) {
        requiresReview = true;
        reviewReason = 'Potential duplicate matches found';
      }
      
      // Check for validation errors
      if (extractResult.validation_errors?.length > 0) {
        routingDecision = 'human_review';
        requiresReview = true;
        reviewReason = reviewReason || extractResult.validation_errors.join('; ');
      }
      
      // Check for budget issues
      if (extractResult.budget_status === 'over_budget') {
        requiresReview = true;
        reviewReason = reviewReason || 'Invoice exceeds AFE budget';
      }
      
      // Check confidence score
      if (confidenceScore < 60) {
        routingDecision = 'human_review';
        requiresReview = true;
        reviewReason = reviewReason || 'Low confidence score requires review';
      }
    }

    // ==================================================================
    // STEP 4: Update invoice status based on routing decision
    // ==================================================================
    console.log('Step 4: Updating invoice status based on routing decision...');
    
    let finalStatus = 'validated';
    
    if (routingDecision === 'auto_approve' && !requiresReview) {
      finalStatus = 'approved_auto';
      
      // Create auto-approval record
      await supabase.from('approvals').insert({
        invoice_id,
        approver_id: user.id,
        status: 'approved',
        amount_approved: invoice.amount,
        approval_date: new Date().toISOString(),
        comments: 'Auto-approved by HIL router',
        auto_approved: true,
      });
    } else if (requiresReview || routingDecision === 'human_review') {
      finalStatus = 'needs_review';
    } else {
      finalStatus = 'processing';
    }

    // ==================================================================
    // STEP 6: Update final invoice status
    // ==================================================================
    console.log('Step 6: Updating invoice status to:', finalStatus);
    
    await supabase
      .from('invoices')
      .update({ status: finalStatus })
      .eq('id', invoice_id);

    // ==================================================================
    // Return orchestration result
    // ==================================================================
    const result = {
      success: true,
      invoice_id,
      status: finalStatus,
      extraction: {
        extracted_data: extractResult.extracted_data,
        budget_status: extractResult.budget_status,
        budget_remaining: extractResult.budget_remaining,
        validation_errors: extractResult.validation_errors,
        validation_warnings: extractResult.validation_warnings,
        confidence_score: confidenceScore,
      },
      duplicate_detection: {
        is_duplicate: dupResult?.is_exact_duplicate || false,
        potential_matches: dupResult?.potential_duplicates?.length || 0,
        risk_score: dupResult?.risk_score || 0,
      },
      hil_routing: {
        routing_decision: routingDecision,
        requires_review: requiresReview,
        review_reason: reviewReason,
      },
      approval: {
        requires_review: requiresReview,
        review_reason: reviewReason,
        auto_approved: finalStatus === 'approved_auto',
        routing_decision: routingDecision
      }
    };

    console.log('Invoice intake complete:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Invoice intake error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
