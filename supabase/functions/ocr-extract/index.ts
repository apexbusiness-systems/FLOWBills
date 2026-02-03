import { createClient } from 'jsr:@supabase/supabase-js@2';
import { z } from "zod";
import { toMessage } from "../_shared/errors.ts";
import { corsHeaders } from '../_shared/cors.ts';

// Validation Schema
const OCRRequestSchema = z.object({
  file_data: z.string().min(1, "File data is required"),
  file_type: z.string().min(1, "File type is required"),
  invoice_id: z.string().uuid("Invalid invoice_id format").optional(),
});

interface ExtractedFields {
  invoice_number: string | null;
  amount: number | null;
  currency: string | null;
  vendor_name: string | null;
  invoice_date: string | null;
  due_date: string | null;
  po_number: string | null;
  afe_number: string | null;
  uwi: string | null;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
}

interface OCRResponse {
  success: boolean;
  extracted_data?: ExtractedFields;
  raw_text?: string;
  confidence_scores?: Record<string, number>;
  ocr_metadata?: {
    processing_time: number;
    method: string;
    confidence_average: number;
  };
  error?: string;
}

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // 1. Validation
    const body = await req.json();
    const parseResult = OCRRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.issues
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { file_data, file_type, invoice_id } = parseResult.data;
    
    console.log(`[OCR] Processing ${file_type} document${invoice_id ? ` for invoice ${invoice_id}` : ''}`);

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // 2. Prepare Image URL
    let imageUrl = file_data;
    if (!file_data.startsWith('data:')) {
      const mimeType = file_type.includes('pdf') ? 'application/pdf' : 
                       file_type.includes('png') ? 'image/png' : 'image/jpeg';
      imageUrl = `data:${mimeType};base64,${file_data}`;
    }

    // 3. AI Extraction Prompt
    const extractionPrompt = `You are an expert invoice OCR system for oil & gas industry invoices. Analyze this document image and extract ALL text and structured data.

Extract the following fields (use null if not found):
1. invoice_number - The invoice number/ID
2. amount - Total amount (numeric only, no currency symbols)
3. currency - Currency code (CAD, USD, etc.)
4. vendor_name - Company/vendor name issuing the invoice
5. invoice_date - Invoice date in YYYY-MM-DD format
6. due_date - Payment due date in YYYY-MM-DD format
7. po_number - Purchase order number
8. afe_number - AFE (Authorization for Expenditure) number (oil & gas specific)
9. uwi - UWI (Unique Well Identifier) if present
10. line_items - Array of line items with description, quantity, unit_price, amount

Also provide:
- raw_text: All readable text from the document
- confidence_scores: Your confidence (0-1) for each extracted field

Respond in this exact JSON format:
{
  "invoice_number": "string or null",
  "amount": number or null,
  "currency": "string or null",
  "vendor_name": "string or null",
  "invoice_date": "YYYY-MM-DD or null",
  "due_date": "YYYY-MM-DD or null",
  "po_number": "string or null",
  "afe_number": "string or null",
  "uwi": "string or null",
  "line_items": [{"description": "string", "quantity": number, "unit_price": number, "amount": number}],
  "raw_text": "all text from document",
  "confidence_scores": {"invoice_number": 0.95, "amount": 0.90, ...}
}`;

    console.log('[OCR] Calling Lovable AI vision model...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
              { type: 'text', text: extractionPrompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 4096,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[OCR] AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits exhausted. Please add funds.');
      }
      throw new Error(`AI extraction failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI model');
    }

    // 4. Parse AI Response
    let parsed: any;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[OCR] Failed to parse AI response:', content);
      throw new Error('Failed to parse extraction results');
    }

    const processingTime = Date.now() - startTime;
    
    // Calculate average confidence
    const confidenceScores = parsed.confidence_scores || {};
    const confidenceValues = Object.values(confidenceScores).filter((v): v is number => typeof v === 'number');
    const avgConfidence = confidenceValues.length > 0 
      ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length 
      : 0.5;

    const extracted_data: ExtractedFields = {
      invoice_number: parsed.invoice_number || null,
      amount: typeof parsed.amount === 'number' ? parsed.amount : null,
      currency: parsed.currency || 'CAD',
      vendor_name: parsed.vendor_name || null,
      invoice_date: parsed.invoice_date || null,
      due_date: parsed.due_date || null,
      po_number: parsed.po_number || null,
      afe_number: parsed.afe_number || null,
      uwi: parsed.uwi || null,
      line_items: Array.isArray(parsed.line_items) ? parsed.line_items : [],
    };

    const ocr_metadata = {
      processing_time: processingTime,
      method: 'lovable-ai-vision',
      confidence_average: avgConfidence
    };

    console.log(`[OCR] Extraction complete in ${processingTime}ms, avg confidence: ${(avgConfidence * 100).toFixed(1)}%`);

    // 5. Update Invoice & Audit Log
    if (invoice_id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );

      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          extracted_data,
          confidence_score: Math.round(avgConfidence * 100),
        })
        .eq('id', invoice_id);

      if (updateError) {
        console.error('[OCR] Failed to update invoice:', updateError);
      }

      await supabase.from('audit_logs').insert({
        action: 'OCR_EXTRACTION',
        entity_type: 'invoice',
        entity_id: invoice_id,
        new_values: { 
          ocr_confidence: avgConfidence,
          method: 'lovable-ai-vision',
          processing_time_ms: processingTime
        },
        user_id: null
      });
    }

    const response: OCRResponse = {
      success: true,
      extracted_data,
      raw_text: parsed.raw_text || '',
      confidence_scores: confidenceScores,
      ocr_metadata
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const processingTime = Date.now() - startTime;
    console.error(`[OCR] Error after ${processingTime}ms:`, err);
    
    const errorResponse: OCRResponse = {
      success: false,
      error: toMessage(err)
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
