import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { href, source, ts } = await req.json();

    // Log for metrics (in production, write to audit_logs or separate clicks table)
    console.log(JSON.stringify({
      event: 'nav_click',
      href: String(href || 'unknown'),
      source: String(source || 'unknown'),
      timestamp: ts || Date.now(),
    }));

    // Optional: Write to database for persistence
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('audit_logs').insert({
      event_type: 'nav_click',
      metadata: { href, source, ts },
      created_at: new Date().toISOString(),
    });

    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Track click error:', error);
    return new Response(null, {
      status: 204, // Silent fail
      headers: corsHeaders,
    });
  }
});
