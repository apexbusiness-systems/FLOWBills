import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CRMSyncRequest {
  entity_type: 'lead' | 'customer' | 'contact';
  entity_id: string;
  action: 'create' | 'update' | 'delete';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { entity_type, entity_id, action }: CRMSyncRequest = await req.json();

    console.log('CRM sync request:', { entity_type, entity_id, action });

    // Fetch entity data
    let entityData;
    if (entity_type === 'lead') {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('id', entity_id)
        .single();
      entityData = data;
    }

    if (!entityData && action !== 'delete') {
      throw new Error(`Entity not found: ${entity_type}:${entity_id}`);
    }

    // Store sync log
    await supabase
      .from('crm_sync_logs')
      .insert({
        entity_type,
        entity_id,
        action,
        entity_data: entityData,
        sync_status: 'pending',
      });

    // In production, integrate with actual CRM API (e.g., Salesforce, HubSpot)
    // For now, we just log the sync attempt
    console.log('CRM sync initiated:', { entity_type, entity_id, action });

    return new Response(
      JSON.stringify({
        success: true,
        message: `CRM sync ${action} queued for ${entity_type}:${entity_id}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('CRM sync error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
