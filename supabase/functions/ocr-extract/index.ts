import { createClient } from 'jsr:@supabase/supabase-js@2';
import { toMessage } from '../_shared/errors.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Type definitions
interface OCRRequest {
  file_data: string;
  file_type: string;
  invoice_id?: string;
}

interface OCRResponse {
  success: boolean;
  extracted_data?: {
    invoice_number: string | null;
    amount: number | null;
    currency: string | null;
    vendor_name: string | null;
    invoice_date: string | null;
    due_date: string | null;
    po_number: string | null;
  };
  raw_text?: string;
  confidence_scores?: Record<string, number>;
  ocr_metadata?: {
    processing_time: number;
    method: string;
    confidence_average: number;
  };
  error?: string;
}

// Helper to handle undefined values
const u = <T>(value: T | null | undefined): T | null => value ?? null;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { file_data, file_type, invoice_id }: OCRRequest = await req.json();

    console.log(`Processing OCR for file type: ${file_type}`);
    const startTime = Date.now();

    // Simulate OCR processing with basic text extraction
    // In production, integrate with Tesseract.js or cloud OCR service
    const mockExtraction = await simulateOCRExtraction(file_data, file_type);

    const processingTime = Date.now() - startTime;

    const extracted_data = {
      invoice_number: u(mockExtraction.fields.invoice_number),
      amount: u(mockExtraction.fields.amount),
      currency: u(mockExtraction.fields.currency),
      vendor_name: u(mockExtraction.fields.vendor_name),
      invoice_date: u(mockExtraction.fields.invoice_date),
      due_date: u(mockExtraction.fields.due_date),
      po_number: u(mockExtraction.fields.po_number),
    };

    const ocr_metadata = {
      processing_time: processingTime,
      method: 'tesseract-simulation',
      confidence_average: Object.values(mockExtraction.confidence_scores).reduce((a, b) =>
        a + b, 0) / Object.values(mockExtraction.confidence_scores).length,
    };

    const response: OCRResponse = {
      success: true,
      extracted_data,
      raw_text: mockExtraction.raw_text,
      confidence_scores: mockExtraction.confidence_scores,
      ocr_metadata,
    };

    // Update invoice with OCR results if invoice_id provided
    if (invoice_id) {
      const avg = response.ocr_metadata?.confidence_average ?? 0;
      const confidence_score = Math.round(avg);

      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          raw_text: mockExtraction.raw_text,
          field_confidence_scores: mockExtraction.confidence_scores,
          ocr_metadata: response.ocr_metadata,
          extracted_data: mockExtraction.fields,
          confidence_score,
        })
        .eq('id', invoice_id);

      if (updateError) {
        console.error('Failed to update invoice:', updateError);
      }
    }

    // Log audit event
    const avg = response.ocr_metadata?.confidence_average ?? 0;
    await supabase.from('audit_logs').insert({
      action: 'OCR_EXTRACTION',
      entity_type: 'invoice',
      entity_id: invoice_id || crypto.randomUUID(),
      new_values: { ocr_confidence: avg },
      user_id: null, // System action
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    console.error('OCR extraction error:', err);

    const errorResponse: OCRResponse = {
      success: false,
      error: toMessage(err),
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function simulateOCRExtraction(_fileData: string, _fileType: string) {
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock OCR results based on common invoice patterns
  const mockRawText = `
    INVOICE
    Invoice Number: INV-2024-001234
    Date: 2024-01-15
    Due Date: 2024-02-14
    
    Bill To:
    FlowAi Energy Solutions
    
    From:
    Oilfield Services Corp
    Tax ID: 123456789
    
    Description: Drilling services and equipment rental
    Amount: $12,500.00 CAD
    Tax: $1,625.00
    Total: $14,125.00
    
    Payment Terms: Net 30
    PO Number: PO-2024-567
  `;

  // Extract structured data using simple regex patterns
  const extractField = (pattern: RegExp, text: string): string | null => {
    const match = text.match(pattern);
    return match ? match[1].trim() : null;
  };

  const extractAmount = (text: string): number | null => {
    const amountMatch = text.match(/(?:Amount|Total):\s*\$?([\d,]+\.?\d*)/i);
    if (amountMatch) {
      return parseFloat(amountMatch[1].replace(/,/g, ''));
    }
    return null;
  };

  return {
    raw_text: mockRawText,
    fields: {
      invoice_number: extractField(/Invoice Number:\s*([^\n]+)/i, mockRawText),
      amount: extractAmount(mockRawText),
      currency: 'CAD',
      vendor_name: extractField(/From:\s*([^\n]+)/i, mockRawText),
      invoice_date: extractField(/Date:\s*([^\n]+)/i, mockRawText),
      due_date: extractField(/Due Date:\s*([^\n]+)/i, mockRawText),
      po_number: extractField(/PO Number:\s*([^\n]+)/i, mockRawText),
    },
    confidence_scores: {
      invoice_number: 0.95,
      amount: 0.90,
      vendor_name: 0.88,
      invoice_date: 0.92,
      due_date: 0.89,
      po_number: 0.85,
    },
  };
}
