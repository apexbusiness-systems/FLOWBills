import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

// Input validation schema
const SendRequestSchema = z.object({
  document_id: z.string().min(1, "Document ID is required"),
  sender_participant_id: z.string().min(1, "Sender participant ID is required"),
  receiver_participant_id: z.string().min(1, "Receiver participant ID is required"),
  document_type_id: z.string().optional().default("urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"),
  process_id: z.string().optional().default("urn:fdc:peppol.eu:2017:poacc:billing:01:1.0"),
});

// BIS 3.0 envelope builder (pure function)
function buildBIS30(xmlContent: string, metadata: any): string {
  const { sender_participant_id, receiver_participant_id, document_type_id, process_id } = metadata;
  const messageId = `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Build SBDH (Standard Business Document Header) envelope
  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
  <StandardBusinessDocument xmlns="http://www.unece.org/cefact/namespaces/StandardBusinessDocumentHeader">
    <StandardBusinessDocumentHeader>
      <HeaderVersion>1.0</HeaderVersion>
      <Sender>
        <Identifier Authority="iso6523-actorid-upis">${sender_participant_id}</Identifier>
      </Sender>
      <Receiver>
        <Identifier Authority="iso6523-actorid-upis">${receiver_participant_id}</Identifier>
      </Receiver>
      <DocumentIdentification>
        <Standard>urn:oasis:names:specification:ubl:schema:xsd:Invoice-2</Standard>
        <TypeVersion>2.1</TypeVersion>
        <InstanceIdentifier>${messageId}</InstanceIdentifier>
        <Type>${document_type_id}</Type>
        <CreationDateAndTime>${new Date().toISOString()}</CreationDateAndTime>
      </DocumentIdentification>
      <BusinessScope>
        <Scope>
          <Type>DOCUMENTID</Type>
          <InstanceIdentifier>${document_type_id}</InstanceIdentifier>
        </Scope>
        <Scope>
          <Type>PROCESSID</Type>
          <InstanceIdentifier>${process_id}</InstanceIdentifier>
        </Scope>
      </BusinessScope>
    </StandardBusinessDocumentHeader>
    ${xmlContent}
  </StandardBusinessDocument>`;
  
  return envelope;
}

// Queue job with exponential backoff
async function enqueueMessage(supabase: any, jobData: any, tenantId: string): Promise<string> {
  const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const { error } = await supabase
    .from('queue_jobs')
    .insert({
      id: jobId,
      queue_name: 'peppol_send',
      job_data: jobData,
      scheduled_at: new Date().toISOString(),
      status: 'pending'
    });
    
  if (error) {
    throw new Error(`Failed to enqueue message: ${error.message}`);
  }
  
  return jobId;
}

// Mock Peppol AP send (replace with actual AP integration)
async function sendToPeppolAP(envelope: string, messageId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Mock AP endpoint - replace with actual Peppol Access Point
    const apUrl = Deno.env.get('PEPPOL_AP_URL') || 'http://localhost:8080/ap/send';
    
    const response = await fetch(apUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'X-Message-Id': messageId,
        'Authorization': `Bearer ${Deno.env.get('PEPPOL_AP_TOKEN') || 'mock-token'}`
      },
      body: envelope
    });
    
    if (!response.ok) {
      return { success: false, error: `AP returned ${response.status}: ${await response.text()}` };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse and validate request
    const body = await req.json();
    const parsed = SendRequestSchema.safeParse(body);
    
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

    const { document_id, sender_participant_id, receiver_participant_id, document_type_id, process_id } = parsed.data;
    const tenantId = body.tenant_id || 'system';

    // Check if document is validated
    const { data: document, error: docError } = await supabase
      .from('einvoice_documents')
      .select('*')
      .eq('document_id', document_id)
      .eq('tenant_id', tenantId)
      .single();

    if (docError || !document) {
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (document.status !== 'validated') {
      return new Response(
        JSON.stringify({ 
          error: 'Document must be validated before sending',
          current_status: document.status 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate message ID for idempotency
    const messageId = `${document_id}-${Date.now()}`;
    
    // Check for existing message (idempotency)
    const { data: existingMessage } = await supabase
      .from('peppol_messages')
      .select('*')
      .eq('document_id', document.id)
      .eq('direction', 'outbound')
      .single();

    if (existingMessage) {
      return new Response(JSON.stringify({
        message_id: existingMessage.message_id,
        status: existingMessage.status,
        already_exists: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build BIS 3.0 envelope
    const envelope = buildBIS30(document.xml_content, {
      sender_participant_id,
      receiver_participant_id,
      document_type_id,
      process_id
    });

    // Create Peppol message record
    const { data: peppolMessage, error: messageError } = await supabase
      .from('peppol_messages')
      .insert({
        document_id: document.id,
        message_id: messageId,
        direction: 'outbound',
        sender_participant_id,
        receiver_participant_id,
        document_type_id,
        process_id,
        status: 'queued',
        tenant_id: tenantId
      })
      .select()
      .single();

    if (messageError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create message record' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Try to send immediately, fall back to queue on failure
    const sendResult = await sendToPeppolAP(envelope, messageId);
    
    if (sendResult.success) {
      // Update message status
      await supabase
        .from('peppol_messages')
        .update({ 
          status: 'sent',
          completed_at: new Date().toISOString()
        })
        .eq('id', peppolMessage.id);

      // Update document status
      await supabase
        .from('einvoice_documents')
        .update({ status: 'sent' })
        .eq('id', document.id);

      return new Response(JSON.stringify({
        message_id: messageId,
        status: 'sent',
        sent_at: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Enqueue for retry with exponential backoff
      const jobId = await enqueueMessage(supabase, {
        message_id: messageId,
        envelope,
        tenant_id: tenantId,
        retry_count: 0
      }, tenantId);

      // Update message status
      await supabase
        .from('peppol_messages')
        .update({ 
          status: 'queued',
          error_details: { initial_error: sendResult.error }
        })
        .eq('id', peppolMessage.id);

      // Increment failure metrics
      await supabase.from('model_stats').insert({
        tenant_id: tenantId,
        model: 'peppol_sender',
        stage: 'send',
        confidence: 0,
        payload: {
          message_id: messageId,
          error: sendResult.error,
          queued_for_retry: true
        }
      });

      return new Response(JSON.stringify({
        message_id: messageId,
        status: 'queued',
        job_id: jobId,
        error: sendResult.error,
        will_retry: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('E-Invoice send error:', error);
    return new Response(JSON.stringify({ 
      error: 'Send processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});