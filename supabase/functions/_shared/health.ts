import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Standard health check responses
export const healthResponses = {
  // Basic liveness check - always returns ok
  healthz: () => new Response(
    JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'flowai-edge-function'
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  ),

  // Readiness check with database connectivity
  readyz: async () => {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
      // Test database connectivity
      const { data, error } = await supabase
        .from('invoices')
        .select('count(*)')
        .limit(1);

      if (error) {
        console.error('Database health check failed:', error);
        return new Response(
          JSON.stringify({ 
            status: 'not ready', 
            error: 'Database connection failed',
            timestamp: new Date().toISOString()
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 503 
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          status: 'ready', 
          timestamp: new Date().toISOString(),
          database: 'connected'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    } catch (error) {
      console.error('Health check error:', error);
      return new Response(
        JSON.stringify({ 
          status: 'not ready', 
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 503 
        }
      );
    }
  },

  // Prometheus metrics endpoint
  metrics: async () => {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
      // Collect basic metrics
      const [invoicesResult, duplicatesResult, reviewQueueResult] = await Promise.all([
        supabase.from('invoices').select('count(*)', { count: 'exact' }),
        supabase.from('exceptions').select('count(*)', { count: 'exact' }).eq('exception_type', 'duplicate'),
        supabase.from('review_queue').select('count(*)', { count: 'exact' })
      ]);

      const metrics = `# HELP flowai_invoices_total Total number of invoices processed
# TYPE flowai_invoices_total counter
flowai_invoices_total ${invoicesResult.count || 0}

# HELP flowai_duplicates_detected_total Total number of duplicate invoices detected  
# TYPE flowai_duplicates_detected_total counter
flowai_duplicates_detected_total ${duplicatesResult.count || 0}

# HELP flowai_hil_queue_size Current number of items in human-in-the-loop review queue
# TYPE flowai_hil_queue_size gauge
flowai_hil_queue_size ${reviewQueueResult.count || 0}

# HELP flowai_http_requests_total Total HTTP requests processed
# TYPE flowai_http_requests_total counter
flowai_http_requests_total{status="200"} 1

# HELP flowai_function_up Function availability indicator
# TYPE flowai_function_up gauge
flowai_function_up 1
`;

      return new Response(
        metrics,
        { 
          headers: { ...corsHeaders, 'Content-Type': 'text/plain; version=0.0.4' },
          status: 200 
        }
      );
    } catch (error) {
      console.error('Metrics collection error:', error);
      return new Response(
        `# HELP flowai_function_up Function availability indicator
# TYPE flowai_function_up gauge
flowai_function_up 0
`,
        { 
          headers: { ...corsHeaders, 'Content-Type': 'text/plain; version=0.0.4' },
          status: 500 
        }
      );
    }
  }
};

// Handle CORS preflight requests
export const handleCORS = () => new Response(null, { headers: corsHeaders });

// Route health check requests
export const routeHealthCheck = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const path = url.pathname;

  if (req.method === 'OPTIONS') {
    return handleCORS();
  }

  switch (path) {
    case '/healthz':
      return healthResponses.healthz();
    case '/readyz':
      return await healthResponses.readyz();
    case '/metrics':
      return await healthResponses.metrics();
    default:
      return new Response(
        JSON.stringify({ error: 'Not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
  }
};