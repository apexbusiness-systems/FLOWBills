import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Create extraction record
    const { data: extraction, error: extractionError } = await supabase
      .from('invoice_extractions')
      .insert({
        invoice_id,
        user_id: user.id,
        extraction_status: 'processing'
      })
      .select()
      .single();

    if (extractionError) {
      console.error('Error creating extraction record:', extractionError);
      return new Response(JSON.stringify({ error: 'Failed to create extraction record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use Lovable AI to extract structured data
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Extracting invoice data with AI...');

    const extractionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting oil & gas billing information from invoices. Extract all relevant data with high accuracy.`
          },
          {
            role: 'user',
            content: `Extract the following information from this invoice content:\n\n${file_content}\n\nProvide structured extraction.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_invoice_data",
              description: "Extract structured oil & gas billing data from invoice",
              parameters: {
                type: "object",
                properties: {
                  afe_number: {
                    type: "string",
                    description: "Authorization for Expenditure number (e.g., AFE-2024-001)"
                  },
                  uwi: {
                    type: "string",
                    description: "Unique Well Identifier (14-digit format)"
                  },
                  field_ticket_numbers: {
                    type: "array",
                    items: { type: "string" },
                    description: "Field ticket reference numbers"
                  },
                  po_number: {
                    type: "string",
                    description: "Purchase order number"
                  },
                  service_period_start: {
                    type: "string",
                    description: "Service period start date (YYYY-MM-DD)"
                  },
                  service_period_end: {
                    type: "string",
                    description: "Service period end date (YYYY-MM-DD)"
                  },
                  line_items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string" },
                        quantity: { type: "number" },
                        unit_price: { type: "number" },
                        amount: { type: "number" },
                        service_code: { type: "string" }
                      }
                    },
                    description: "Line item details"
                  },
                  confidence_scores: {
                    type: "object",
                    properties: {
                      afe_number: { type: "number", minimum: 0, maximum: 1 },
                      uwi: { type: "number", minimum: 0, maximum: 1 },
                      field_tickets: { type: "number", minimum: 0, maximum: 1 },
                      line_items: { type: "number", minimum: 0, maximum: 1 }
                    },
                    description: "Confidence scores for each extraction"
                  }
                },
                required: ["confidence_scores"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_invoice_data" } }
      }),
    });

    if (!extractionResponse.ok) {
      throw new Error(`AI extraction failed: ${extractionResponse.statusText}`);
    }

    const aiResult = await extractionResponse.json();
    const toolCall = aiResult.choices[0]?.message?.tool_calls?.[0];
    const extractedData = toolCall ? JSON.parse(toolCall.function.arguments) : {};

    console.log('Extracted data:', extractedData);

    // Validate against AFE budget
    let budgetStatus = 'no_afe';
    let budgetRemaining = null;
    let afeId = null;
    const validationErrors: string[] = [];
    const validationWarnings: string[] = [];

    if (extractedData.afe_number) {
      const { data: afe } = await supabase
        .from('afes')
        .select('*')
        .eq('user_id', user.id)
        .eq('afe_number', extractedData.afe_number)
        .eq('status', 'active')
        .single();

      if (afe) {
        afeId = afe.id;
        const { data: invoice } = await supabase
          .from('invoices')
          .select('amount')
          .eq('id', invoice_id)
          .single();

        if (invoice) {
          const newSpent = parseFloat(afe.spent_amount) + parseFloat(invoice.amount);
          budgetRemaining = parseFloat(afe.budget_amount) - newSpent;

          if (budgetRemaining >= 0) {
            budgetStatus = 'within_budget';
          } else {
            budgetStatus = 'over_budget';
            validationErrors.push(`Invoice amount $${invoice.amount} exceeds AFE budget. Over by $${Math.abs(budgetRemaining)}`);
          }

          // Check if approaching budget limit (90%)
          if (budgetRemaining < parseFloat(afe.budget_amount) * 0.1) {
            validationWarnings.push(`AFE ${afe.afe_number} is at ${((newSpent / parseFloat(afe.budget_amount)) * 100).toFixed(1)}% of budget`);
          }
        }
      } else {
        budgetStatus = 'afe_not_found';
        validationWarnings.push(`AFE ${extractedData.afe_number} not found in system`);
      }
    }

    // Look up UWI
    let uwiId = null;
    if (extractedData.uwi) {
      const { data: uwi } = await supabase
        .from('uwis')
        .select('id')
        .eq('user_id', user.id)
        .eq('uwi', extractedData.uwi)
        .single();
      
      if (uwi) {
        uwiId = uwi.id;
      } else {
        validationWarnings.push(`UWI ${extractedData.uwi} not found in system`);
      }
    }

    // Update extraction record
    const { error: updateError } = await supabase
      .from('invoice_extractions')
      .update({
        extraction_status: 'completed',
        afe_number: extractedData.afe_number || null,
        afe_id: afeId,
        uwi: extractedData.uwi || null,
        uwi_id: uwiId,
        field_ticket_refs: extractedData.field_ticket_numbers || [],
        po_number: extractedData.po_number || null,
        service_period_start: extractedData.service_period_start || null,
        service_period_end: extractedData.service_period_end || null,
        line_items: extractedData.line_items || [],
        extracted_data: extractedData,
        confidence_scores: extractedData.confidence_scores || {},
        budget_status: budgetStatus,
        budget_remaining: budgetRemaining,
        validation_errors: validationErrors,
        validation_warnings: validationWarnings,
        extracted_at: new Date().toISOString(),
        validated_at: new Date().toISOString()
      })
      .eq('id', extraction.id);

    if (updateError) {
      console.error('Error updating extraction:', updateError);
    }

    // Update invoice status based on validation
    let invoiceStatus = 'pending';
    if (validationErrors.length > 0) {
      invoiceStatus = 'validation_failed';
    } else if (validationWarnings.length > 0) {
      invoiceStatus = 'needs_review';
    } else if (budgetStatus === 'within_budget') {
      invoiceStatus = 'validated';
    }

    await supabase
      .from('invoices')
      .update({ status: invoiceStatus })
      .eq('id', invoice_id);

    return new Response(JSON.stringify({
      success: true,
      extraction_id: extraction.id,
      extracted_data: extractedData,
      budget_status: budgetStatus,
      budget_remaining: budgetRemaining,
      validation_errors: validationErrors,
      validation_warnings: validationWarnings
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in invoice-extract function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
