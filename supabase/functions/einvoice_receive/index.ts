import { createClient } from "jsr:@supabase/supabase-js@2"
import { corsHeaders } from '../_shared/cors.ts'
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

// Input validation schema for inbound webhooks
const ReceiveRequestSchema = z.object({
  message_id: z.string().min(1, "Message ID is required"),
  sender_participant_id: z.string().min(1, "Sender participant ID is required"),
  receiver_participant_id: z.string().min(1, "Receiver participant ID is required"),
  document_type_id: z.string().min(1, "Document type ID is required"),
  process_id: z.string().min(1, "Process ID is required"),
  xml_content: z.string().min(1, "XML content is required"),
  webhook_secret: z.string().optional(),
});

// Extract document metadata from XML
function extractDocumentMetadata(xmlContent: string): {
  document_id: string | null;
  total_amount: number | null;
  currency: string | null;
  issue_date: string | null;
  due_date: string | null;
  format: string;
} {
  let document_id = null;
  let total_amount = null;
  let currency = null;
  let issue_date = null;
  let due_date = null;
  let format = 'bis30'; // default

  try {
    // Extract Invoice ID
    const idMatch = xmlContent.match(/<cbc:ID[^>]*>([^<]+)<\/cbc:ID>/);
    if (idMatch) {
      document_id = idMatch[1];
    }

    // Extract total amount
    const amountMatch = xmlContent.match(/<cbc:TaxInclusiveAmount[^>]*currencyID="([^"]*)"[^>]*>([^<]+)<\/cbc:TaxInclusiveAmount>/);
    if (amountMatch) {
      currency = amountMatch[1];
      total_amount = parseFloat(amountMatch[2]);
    }

    // Extract issue date
    const issueDateMatch = xmlContent.match(/<cbc:IssueDate[^>]*>([^<]+)<\/cbc:IssueDate>/);
    if (issueDateMatch) {
      issue_date = issueDateMatch[1];
    }

    // Extract due date
    const dueDateMatch = xmlContent.match(/<cbc:DueDate[^>]*>([^<]+)<\/cbc:DueDate>/);
    if (dueDateMatch) {
      due_date = dueDateMatch[1];
    }

    // Detect format based on content
    if (xmlContent.includes('CrossIndustryInvoice')) {
      format = 'xrechnung';
    } else if (xmlContent.includes('CrossIndustryDocument')) {
      format = 'facturx';
    } else if (xmlContent.includes('urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0')) {
      format = 'bis30';
    }

  } catch (error) {
    console.error('Error extracting metadata:', error);
  }

  return {
    document_id,
    total_amount,
    currency,
    issue_date,
    due_date,
    format
  };
}

// Calculate confidence score based on document completeness
function calculateConfidenceScore(metadata: any, xmlContent: string): number {
  let score = 50; // base score

  // Required fields presence
  if (metadata.document_id) score += 15;
  if (metadata.total_amount !== null) score += 15;
  if (metadata.currency) score += 10;
  if (metadata.issue_date) score += 10;

  // XML structure quality
  if (xmlContent.includes('cac:AccountingSupplierParty')) score += 5;
  if (xmlContent.includes('cac:AccountingCustomerParty')) score += 5;

  return Math.min(100, score);
}

// Route to HIL if confidence is low
async function routeToHIL(supabase: any, documentId: string, reason: string, confidenceScore: number): Promise<void> {
  try {
    await supabase.from('review_queue').insert({
      invoice_id: documentId,
      reason: `E-Invoice: ${reason}`,
      confidence_score: confidenceScore,
      priority: confidenceScore < 60 ? 1 : 3, // High priority for very low confidence
      flagged_fields: {
        confidence_below_threshold: true,
        inbound_einvoice: true
      }
    });
  } catch (error) {
    console.error('Failed to route to HIL:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify webhook secret if provided
    const expectedSecret = Deno.env.get('PEPPOL_WEBHOOK_SECRET');
    const providedSecret = req.headers.get('X-Webhook-Secret');
    
    if (expectedSecret && providedSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook secret' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse and validate request
    const body = await req.json();
    const parsed = ReceiveRequestSchema.safeParse(body);
    
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed',
          details: parsed.error.issues 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { 
      message_id, 
      sender_participant_id, 
      receiver_participant_id, 
      document_type_id, 
      process_id, 
      xml_content 
    } = parsed.data;

    const tenantId = body.tenant_id || 'system';

    // Check for duplicate message (idempotency)
    const { data: existingMessage } = await supabase
      .from('peppol_messages')
      .select('*')
      .eq('message_id', message_id)
      .single();

    if (existingMessage) {
      return new Response(JSON.stringify({
        message_id,
        status: 'already_processed',
        document_id: existingMessage.document_id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract document metadata
    const metadata = extractDocumentMetadata(xml_content);
    const confidenceScore = calculateConfidenceScore(metadata, xml_content);

    // Create e-invoice document
    const { data: document, error: docError } = await supabase
      .from('einvoice_documents')
      .insert({
        document_id: metadata.document_id || message_id,
        format: metadata.format,
        status: 'received',
        xml_content,
        confidence_score: confidenceScore,
        sender_id: sender_participant_id,
        receiver_id: receiver_participant_id,
        total_amount: metadata.total_amount,
        currency: metadata.currency || 'EUR',
        issue_date: metadata.issue_date,
        due_date: metadata.due_date,
        tenant_id: tenantId
      })
      .select()
      .single();

    if (docError) {
      console.error('Failed to create document:', docError);
      return new Response(
        JSON.stringify({ error: 'Failed to store document' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Peppol message record
    const { error: messageError } = await supabase
      .from('peppol_messages')
      .insert({
        document_id: document.id,
        message_id,
        direction: 'inbound',
        sender_participant_id,
        receiver_participant_id,
        document_type_id,
        process_id,
        status: 'received',
        completed_at: new Date().toISOString(),
        tenant_id: tenantId
      });

    if (messageError) {
      console.error('Failed to create message record:', messageError);
    }

    // Trigger validation
    try {
      await supabase.functions.invoke('einvoice_validate', {
        body: {
          document_id: document.document_id,
          xml_content,
          format: metadata.format,
          tenant_id: tenantId
        }
      });
    } catch (validationError) {
      console.error('Validation trigger failed:', validationError);
    }

    // Route to HIL if confidence is below threshold
    const confidenceThreshold = parseInt(Deno.env.get('HIL_CONFIDENCE_THRESHOLD') || '70');
    
    if (confidenceScore < confidenceThreshold) {
      await routeToHIL(
        supabase, 
        document.id, 
        `Low confidence score: ${confidenceScore}%`, 
        confidenceScore
      );
    } else {
      // Auto-approve high confidence documents
      const { error: approvalError } = await supabase
        .from('einvoice_documents')
        .update({ status: 'validated' })
        .eq('id', document.id);

      if (approvalError) {
        console.error('Auto-approval failed:', approvalError);
      }
    }

    // Log metrics
    await supabase.from('model_stats').insert({
      tenant_id: tenantId,
      model: 'einvoice_receiver',
      stage: 'extraction',
      confidence: confidenceScore / 100,
      payload: {
        message_id,
        format: metadata.format,
        confidence_score: confidenceScore,
        routed_to_hil: confidenceScore < confidenceThreshold
      }
    });

    const response = {
      message_id,
      document_id: document.document_id,
      status: 'received',
      confidence_score: confidenceScore,
      format: metadata.format,
      routed_to_hil: confidenceScore < confidenceThreshold,
      metadata: {
        total_amount: metadata.total_amount,
        currency: metadata.currency,
        issue_date: metadata.issue_date,
        due_date: metadata.due_date
      },
      received_at: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('E-Invoice receive error:', error);
    return new Response(JSON.stringify({ 
      error: 'Receive processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});