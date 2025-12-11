import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

// Detect if content is base64 image/PDF or plain text
function isBase64Content(content: string): boolean {
  return content.startsWith('data:') || /^[A-Za-z0-9+/=]{100,}$/.test(content.slice(0, 200));
}

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

    const { invoice_id, file_content, file_type } = await req.json();

    if (!invoice_id || !file_content) {
      return new Response(JSON.stringify({ error: 'invoice_id and file_content required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[Extract] Processing invoice ${invoice_id}, content type: ${file_type || 'unknown'}`);

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
      console.error('[Extract] Error creating extraction record:', extractionError);
      return new Response(JSON.stringify({ error: 'Failed to create extraction record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let extractedData: any = {};
    const isImageOrPdf = isBase64Content(file_content) || 
      file_type?.includes('image') || 
      file_type?.includes('pdf');

    if (isImageOrPdf) {
      // Use vision model for images/PDFs
      console.log('[Extract] Using vision model for image/PDF extraction...');
      
      let imageUrl = file_content;
      if (!file_content.startsWith('data:')) {
        const mimeType = file_type?.includes('pdf') ? 'application/pdf' : 
                         file_type?.includes('png') ? 'image/png' : 'image/jpeg';
        imageUrl = `data:${mimeType};base64,${file_content}`;
      }

      const visionPrompt = `You are an expert at extracting oil & gas billing information from invoice documents.
      
Analyze this invoice image and extract ALL structured data. Be thorough and accurate.

Required fields to extract:
- afe_number: AFE (Authorization for Expenditure) number (format: AFE-YYYY-XXX or similar)
- uwi: Unique Well Identifier (14-digit Canadian format: XX/XX-XX-XXX-XXWX/X)
- field_ticket_numbers: Array of field ticket reference numbers
- po_number: Purchase order number
- vendor_name: Company issuing the invoice
- invoice_number: Invoice ID/number
- invoice_date: Date of invoice (YYYY-MM-DD)
- due_date: Payment due date (YYYY-MM-DD)
- amount: Total invoice amount (number only)
- currency: Currency code (CAD, USD)
- service_period_start: Service start date (YYYY-MM-DD)
- service_period_end: Service end date (YYYY-MM-DD)
- line_items: Array of line items with {description, quantity, unit_price, amount, service_code}
- raw_text: All readable text from the document

Also provide confidence_scores (0-1) for key fields: afe_number, uwi, field_tickets, line_items, amount

Respond with valid JSON only.`;

      const extractionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: visionPrompt },
                { type: 'image_url', image_url: { url: imageUrl } }
              ]
            }
          ],
          max_tokens: 4096,
        }),
      });

      if (!extractionResponse.ok) {
        const errText = await extractionResponse.text();
        console.error('[Extract] Vision API error:', extractionResponse.status, errText);
        throw new Error(`AI vision extraction failed: ${errText}`);
      }

      const aiResult = await extractionResponse.json();
      const content = aiResult.choices?.[0]?.message?.content || '';
      
      // Parse JSON from response
      try {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
        extractedData = JSON.parse(jsonStr);
      } catch (e) {
        console.error('[Extract] Failed to parse vision response:', content);
        extractedData = { raw_text: content, confidence_scores: {} };
      }

    } else {
      // Use text extraction with tool calling for plain text content
      console.log('[Extract] Using text extraction with tool calling...');
      
      const extractionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
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
                    afe_number: { type: "string", description: "Authorization for Expenditure number" },
                    uwi: { type: "string", description: "Unique Well Identifier (14-digit format)" },
                    field_ticket_numbers: { type: "array", items: { type: "string" }, description: "Field ticket reference numbers" },
                    po_number: { type: "string", description: "Purchase order number" },
                    vendor_name: { type: "string", description: "Vendor/company name" },
                    invoice_number: { type: "string", description: "Invoice number" },
                    invoice_date: { type: "string", description: "Invoice date (YYYY-MM-DD)" },
                    due_date: { type: "string", description: "Due date (YYYY-MM-DD)" },
                    amount: { type: "number", description: "Total amount" },
                    currency: { type: "string", description: "Currency code" },
                    service_period_start: { type: "string", description: "Service period start date" },
                    service_period_end: { type: "string", description: "Service period end date" },
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
                      }
                    },
                    confidence_scores: {
                      type: "object",
                      properties: {
                        afe_number: { type: "number" },
                        uwi: { type: "number" },
                        field_tickets: { type: "number" },
                        line_items: { type: "number" },
                        amount: { type: "number" }
                      }
                    }
                  },
                  required: ["confidence_scores"]
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "extract_invoice_data" } }
        }),
      });

      if (!extractionResponse.ok) {
        const errText = await extractionResponse.text();
        throw new Error(`AI text extraction failed: ${errText}`);
      }

      const aiResult = await extractionResponse.json();
      const toolCall = aiResult.choices[0]?.message?.tool_calls?.[0];
      extractedData = toolCall ? JSON.parse(toolCall.function.arguments) : {};
    }

    console.log('[Extract] Extracted data:', JSON.stringify(extractedData, null, 2));

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
            validationErrors.push(`Invoice exceeds AFE budget by $${Math.abs(budgetRemaining).toFixed(2)}`);
          }

          if (budgetRemaining < parseFloat(afe.budget_amount) * 0.1) {
            validationWarnings.push(`AFE ${afe.afe_number} at ${((newSpent / parseFloat(afe.budget_amount)) * 100).toFixed(1)}% of budget`);
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
    await supabase
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

    // Update invoice status
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
      .update({ 
        status: invoiceStatus,
        vendor_name: extractedData.vendor_name || undefined,
        invoice_number: extractedData.invoice_number || undefined,
      })
      .eq('id', invoice_id);

    // Log audit event
    await supabase.from('audit_logs').insert({
      action: 'INVOICE_EXTRACTION',
      entity_type: 'invoice',
      entity_id: invoice_id,
      user_id: user.id,
      new_values: {
        extraction_id: extraction.id,
        budget_status: budgetStatus,
        validation_errors: validationErrors.length,
        validation_warnings: validationWarnings.length
      }
    });

    console.log(`[Extract] Complete. Status: ${invoiceStatus}, Budget: ${budgetStatus}`);

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
    console.error('[Extract] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
