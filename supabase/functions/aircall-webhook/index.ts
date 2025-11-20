import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { withIdempotency } from "../_shared/idempotency.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
};

interface AircallEvent {
  event: string;
  resource: string;
  data: {
    id: number;
    direction: string;
    from: string;
    to: string;
    status: string;
    started_at?: string;
    answered_at?: string;
    ended_at?: string;
    duration?: number;
    user?: {
      id: number;
      name: string;
      email: string;
    };
    tags?: string[];
    ivr_selection?: string; // IVR menu selection: '1' billing, '2' einvoicing, '3' platform_ocr, '4' security, '0' privacy
    recording_url?: string;
  };
}

// IVR category mapping
const IVR_CATEGORIES: Record<string, string> = {
  '1': 'billing',
  '2': 'einvoicing',
  '3': 'platform_ocr',
  '4': 'security',
  '0': 'privacy', // No recording per PIPEDA
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    return await withIdempotency(
      req,
      async (body: AircallEvent) => {
      console.log('Aircall webhook received:', { event: body.event, resource: body.resource, ivr: body.data.ivr_selection });

      const ivrSelection = body.data.ivr_selection || '3'; // Default to platform
      const category = IVR_CATEGORIES[ivrSelection] || 'platform_ocr';
      const isPrivacyCall = ivrSelection === '0';

      // Store call log (only if not privacy - no recording per PIPEDA)
      let callLogId = null;
      if (!isPrivacyCall) {
        const { data: callLog, error: logError } = await supabase
          .from('support_call_logs')
          .insert({
            external_id: body.data.id.toString(),
            direction: body.data.direction,
            from_number: body.data.from,
            to_number: body.data.to,
            status: body.data.status,
            started_at: body.data.started_at,
            answered_at: body.data.answered_at,
            ended_at: body.data.ended_at,
            duration_seconds: body.data.duration,
            agent_name: body.data.user?.name,
            agent_email: body.data.user?.email,
            tags: [...(body.data.tags || []), category],
            raw_data: body,
          })
          .select('id')
          .single();

        if (logError) {
          console.error('Error storing call log:', logError);
          throw logError;
        }
        callLogId = callLog.id;
      }

      // Create support ticket with masked org context
      let ticketNumber = null;
      if (!isPrivacyCall && body.data.status === 'answered') {
        const requestId = `AIRCALL-${body.data.id}-${Date.now()}`;
        ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;

        const { error: ticketError } = await supabase
          .from('support_tickets')
          .insert({
            ticket_number: ticketNumber,
            call_log_id: callLogId,
            category,
            priority: category === 'security' ? 'high' : 'medium',
            request_id: requestId,
            masked_org_context: {
              caller_number_masked: body.data.from.slice(-4).padStart(body.data.from.length, 'X'),
              duration_seconds: body.data.duration,
              timestamp: body.data.started_at,
            },
          });

        if (ticketError) {
          console.error('Error creating support ticket:', ticketError);
        }
      }

      // Log to security events for audit trail
      await supabase
        .from('security_events')
        .insert({
          event_type: isPrivacyCall ? 'support_call_privacy_no_record' : 'support_call_received',
          severity: 'info',
          details: {
            call_id: body.data.id,
            category,
            direction: body.data.direction,
            status: body.data.status,
            agent: body.data.user?.email,
            ticket_number: ticketNumber,
            pipeda_consent: 'PIPEDA notice: Call may be recorded for quality assurance. Press 0 for privacy (no recording).',
          },
        });

      return new Response(
        JSON.stringify({
          success: true,
          message: isPrivacyCall ? 'Privacy call handled (no recording)' : 'Call logged and ticket created',
          ticket_number: ticketNumber,
          category
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }, {
      scope: 'aircall_webhook',
      tenantId: '00000000-0000-0000-0000-000000000000'
    });
  } catch (error) {
    console.error('Aircall webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
