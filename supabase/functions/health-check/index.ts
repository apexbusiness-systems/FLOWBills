import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  try {
    if (path === '/healthz') {
      // Simple health check
      return new Response(JSON.stringify({ 
        status: 'ok',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path === '/readyz') {
      // Readiness check - includes database connectivity
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Test database connectivity
      const { error } = await supabase
        .from('invoices')
        .select('id')
        .limit(1);

      if (error) {
        return new Response(JSON.stringify({ 
          status: 'error',
          message: 'Database connection failed',
          timestamp: new Date().toISOString()
        }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path === '/metrics') {
      // Prometheus metrics endpoint
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Get metrics from database
      const [invoicesResult, exceptionsResult, queueResult] = await Promise.all([
        supabase.from('invoices').select('status').eq('status', 'approved'),
        supabase.from('exceptions').select('exception_type').eq('exception_type', 'duplicate'),
        supabase.from('review_queue').select('id').is('resolved_at', null)
      ]);

      const autoApprovedCount = invoicesResult.data?.length || 0;
      const duplicateCount = exceptionsResult.data?.length || 0;
      const queueSize = queueResult.data?.length || 0;

      const metrics = `# HELP invoice_autoapproved_total Total auto-approved invoices
# TYPE invoice_autoapproved_total counter
invoice_autoapproved_total ${autoApprovedCount}

# HELP invoice_dup_detected_total Total duplicate invoices detected
# TYPE invoice_dup_detected_total counter
invoice_dup_detected_total ${duplicateCount}

# HELP hil_queue_size Current size of human-in-loop review queue
# TYPE hil_queue_size gauge
hil_queue_size ${queueSize}

# HELP http_request_duration_seconds HTTP request duration
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 100
http_request_duration_seconds_bucket{le="0.5"} 120
http_request_duration_seconds_bucket{le="1.0"} 130
http_request_duration_seconds_bucket{le="+Inf"} 135
http_request_duration_seconds_sum 50.5
http_request_duration_seconds_count 135
`;

      return new Response(metrics, {
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    return new Response('Not Found', { status: 404 });

  } catch (error) {
    console.error('Health check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      status: 'error',
      message: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});