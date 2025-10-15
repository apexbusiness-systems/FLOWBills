// P13 — DSAR Delete Endpoint (PIPEDA Art. 9 — Right to Erasure)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DSARDeleteRequest {
  user_id?: string; // Admin can delete for any user
  confirm_deletion: boolean;
  reason?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { user_id, confirm_deletion, reason }: DSARDeleteRequest = await req.json();
    const targetUserId = user_id || user.id;

    if (!confirm_deletion) {
      throw new Error('Deletion must be explicitly confirmed');
    }

    // Check if user can delete this data
    const { data: userRole } = await supabase.rpc('get_user_role', { user_uuid: user.id });
    const isAdmin = userRole === 'admin';
    
    if (targetUserId !== user.id && !isAdmin) {
      throw new Error('Unauthorized to delete other user data');
    }

    console.log('DSAR deletion requested:', { targetUserId, requestedBy: user.id, reason });

    // Log deletion request BEFORE deletion (evidence)
    const { data: deletionLog } = await supabase
      .from('security_events')
      .insert({
        event_type: 'dsar_deletion_initiated',
        severity: 'critical',
        user_id: user.id,
        details: {
          target_user_id: targetUserId,
          reason: reason || 'User requested erasure per PIPEDA Article 9',
          timestamp: new Date().toISOString(),
          pipeda_compliance: 'Article 9 - Right to Erasure',
        },
      })
      .select()
      .single();

    // Begin deletion (cascade via foreign keys where possible)
    const deletionResults: Record<string, number> = {};

    // Delete user sessions
    const { error: sessionsError, count: sessionsCount } = await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', targetUserId);
    deletionResults.sessions = sessionsCount || 0;

    // Anonymize consent logs (retain for legal compliance but remove PII)
    const { error: consentError, count: consentCount } = await supabase
      .from('consent_logs')
      .update({
        email: null,
        phone: null,
        user_id: null, // Anonymize
      })
      .eq('user_id', targetUserId);
    deletionResults.consent_logs_anonymized = consentCount || 0;

    // Delete invoices (or anonymize depending on legal retention requirements)
    const { error: invoicesError, count: invoicesCount } = await supabase
      .from('invoices')
      .delete()
      .eq('user_id', targetUserId);
    deletionResults.invoices = invoicesCount || 0;

    // Delete support tickets (or anonymize)
    const { error: ticketsError, count: ticketsCount } = await supabase
      .from('support_tickets')
      .update({ customer_id: null })
      .eq('customer_id', targetUserId);
    deletionResults.support_tickets_anonymized = ticketsCount || 0;

    // Log completion
    await supabase.from('security_events').insert({
      event_type: 'dsar_deletion_completed',
      severity: 'critical',
      user_id: user.id,
      details: {
        target_user_id: targetUserId,
        deletion_results: deletionResults,
        deletion_log_id: deletionLog?.id,
        timestamp: new Date().toISOString(),
        pipeda_compliance: 'Article 9 - Right to Erasure Completed',
      },
    });

    // Finally delete auth user (if requested user is deleting themselves)
    if (targetUserId === user.id) {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(targetUserId);
      if (authDeleteError) {
        console.error('Auth user deletion error:', authDeleteError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User data deleted per PIPEDA Article 9',
        deletion_results: deletionResults,
        deletion_log_id: deletionLog?.id,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('DSAR deletion error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
