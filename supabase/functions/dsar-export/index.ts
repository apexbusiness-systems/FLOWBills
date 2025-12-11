// P13 — DSAR Export Endpoint (PIPEDA Art. 8 — Individual Access)
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DSARExportRequest {
  user_id?: string; // Admin can export for any user
  format?: 'json' | 'csv';
  include_audit_logs?: boolean;
}

Deno.serve(async (req) => {
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

    // Verify requesting user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { user_id, format = 'json', include_audit_logs = false }: DSARExportRequest = await req.json();
    const targetUserId = user_id || user.id;

    // Check if user can export this data (own data or admin)
    const { data: userRole } = await supabase.rpc('get_user_role', { user_uuid: user.id });
    const isAdmin = userRole === 'admin';
    
    if (targetUserId !== user.id && !isAdmin) {
      throw new Error('Unauthorized to export other user data');
    }

    console.log('DSAR export requested:', { targetUserId, format, requestedBy: user.id });

    // Gather all personal data (redact secrets)
    const exportData: Record<string, any> = {
      export_metadata: {
        requested_at: new Date().toISOString(),
        requested_by: user.email,
        target_user_id: targetUserId,
        format,
        pipeda_notice: 'This export contains all personal data associated with your account per PIPEDA Article 8.',
      },
      user_profile: {},
      consent_logs: [],
      invoices: [],
      support_tickets: [],
      sessions: [],
    };

    // Fetch user sessions (without tokens)
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('id, ip_address, user_agent, created_at, last_activity, expires_at, is_active')
      .eq('user_id', targetUserId);
    exportData.sessions = sessions || [];

    // Fetch consent logs (redact if admin exporting another user's data)
    const { data: consentLogs } = await supabase
      .from('consent_logs')
      .select('id, consent_type, consent_given, consent_text, created_at, withdrawal_date, email, phone')
      .eq('user_id', targetUserId);
    
    exportData.consent_logs = (consentLogs || []).map(log => ({
      ...log,
      email: isAdmin && targetUserId !== user.id ? '***REDACTED***' : log.email,
      phone: isAdmin && targetUserId !== user.id ? '***REDACTED***' : log.phone,
    }));

    // Fetch invoices (without file_url if sensitive)
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, invoice_number, vendor_id, amount, invoice_date, status, created_at, updated_at')
      .eq('user_id', targetUserId);
    exportData.invoices = invoices || [];

    // Fetch support tickets
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('id, ticket_number, category, priority, status, created_at, resolved_at')
      .eq('customer_id', targetUserId);
    exportData.support_tickets = tickets || [];

    // Optionally include audit logs (admin only)
    if (include_audit_logs && isAdmin) {
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('id, entity_type, action, created_at, ip_address')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(100);
      exportData.audit_logs = auditLogs || [];
    }

    // Log DSAR access for compliance
    await supabase.from('security_events').insert({
      event_type: 'dsar_export_completed',
      severity: 'high',
      user_id: user.id,
      details: {
        target_user_id: targetUserId,
        format,
        timestamp: new Date().toISOString(),
        pipeda_compliance: 'Article 8 - Individual Access Right',
      },
    });

    // Format response
    if (format === 'csv') {
      // Simple CSV conversion for consent logs
      const csvRows = [
        ['Type', 'Given', 'Date', 'Email', 'Phone'],
        ...exportData.consent_logs.map((log: any) => [
          log.consent_type,
          log.consent_given,
          log.created_at,
          log.email || '',
          log.phone || '',
        ]),
      ];
      const csvContent = csvRows.map(row => row.join(',')).join('\n');

      return new Response(csvContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="dsar-export-${targetUserId}-${Date.now()}.csv"`,
        },
      });
    }

    return new Response(
      JSON.stringify(exportData, null, 2),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="dsar-export-${targetUserId}-${Date.now()}.json"`,
        },
      }
    );
  } catch (error) {
    console.error('DSAR export error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
