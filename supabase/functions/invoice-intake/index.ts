import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { invoice_id, file_content } = await req.json();

    if (!invoice_id || !file_content) {
      return new Response(JSON.stringify({ error: 'invoice_id and file_content required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
    // STEP 3: Determine routing based on business rules
    // ==================================================================
    console.log('Step 3: Determining approval routing...');
    
    let finalStatus = 'validated';
    let requiresReview = false;
    let reviewReason = '';
    
    // Check for duplicates
    if (dupResult?.is_exact_duplicate) {
      finalStatus = 'duplicate_suspected';
      requiresReview = true;
      reviewReason = 'Exact duplicate detected';
    } else if (dupResult?.potential_duplicates?.length > 0) {
      requiresReview = true;
      reviewReason = 'Potential duplicate matches found';
    }
    
    // Check for validation errors
    if (extractResult.validation_errors?.length > 0) {
      finalStatus = 'validation_failed';
      requiresReview = true;
      reviewReason = reviewReason || extractResult.validation_errors.join('; ');
    }
    
    // Check for budget issues
    if (extractResult.budget_status === 'over_budget') {
      requiresReview = true;
      reviewReason = reviewReason || 'Invoice exceeds AFE budget';
    }

    // ==================================================================
    // STEP 4: Create approval records based on amount thresholds
    // ==================================================================
    console.log('Step 4: Creating approval records...');
    
    const THRESHOLD_AUTO_APPROVE = 5000;
    const THRESHOLD_MANAGER = 25000;
    
    if (!requiresReview) {
      if (invoice.amount < THRESHOLD_AUTO_APPROVE) {
        // Auto-approve
        finalStatus = 'approved_auto';
        
        await supabase.from('approvals').insert({
          invoice_id,
          user_id: user.id,
          approval_status: 'approved',
          amount_approved: invoice.amount,
          approval_date: new Date().toISOString(),
          comments: 'Auto-approved: amount under $5,000 threshold',
          auto_approved: true,
        });
        
      } else if (invoice.amount < THRESHOLD_MANAGER) {
        // Manager approval required
        finalStatus = 'pending_approval';
        
        await supabase.from('approvals').insert({
          invoice_id,
          user_id: user.id,
          approval_status: 'pending',
          approval_method: 'manager_approval',
          notes: 'Requires manager approval: $5K-$25K range',
        });
        
      } else {
        // CFO approval required
        finalStatus = 'pending_approval';
        
        await supabase.from('approvals').insert({
          invoice_id,
          user_id: user.id,
          approval_status: 'pending',
          approval_method: 'cfo_approval',
          notes: 'Requires CFO approval: amount exceeds $25K',
        });
      }
    }

    // ==================================================================
    // STEP 5: Add to review queue if needed
    // ==================================================================
    if (requiresReview) {
      console.log('Step 5: Adding to review queue...');
      
      const priority = dupResult?.is_exact_duplicate ? 1 : 
                      extractResult.budget_status === 'over_budget' ? 1 : 
                      invoice.amount > THRESHOLD_MANAGER ? 1 : 2;
      
      await supabase.from('review_queue').insert({
        invoice_id,
        user_id: user.id,
        reason: reviewReason,
        confidence_score: extractResult.extracted_data?.confidence_scores?.overall || null,
        risk_factors: dupResult?.is_exact_duplicate ? ['duplicate_detected'] : [],
      });
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
      },
      duplicate_detection: {
        is_duplicate: dupResult?.is_exact_duplicate || false,
        potential_matches: dupResult?.potential_duplicates?.length || 0,
        risk_score: dupResult?.risk_score || 0,
      },
      approval: {
        requires_review: requiresReview,
        review_reason: reviewReason,
        auto_approved: finalStatus === 'approved_auto',
        approval_level: invoice.amount < THRESHOLD_AUTO_APPROVE ? 'auto' :
                       invoice.amount < THRESHOLD_MANAGER ? 'manager' : 'cfo'
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
