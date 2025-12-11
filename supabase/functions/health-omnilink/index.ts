// ============================================================
// APEX OMNiLiNK Health Check Endpoint
// CONFIDENTIAL - Internal Use Only
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthResponse {
  status: 'disabled' | 'ok' | 'degraded' | 'error';
  details: {
    enabled: boolean;
    baseUrlConfigured: boolean;
    tenantConfigured: boolean;
    lastCheck?: string;
    latencyMs?: number;
  };
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Read OMNiLiNK configuration from Supabase secrets
    const enabled = Deno.env.get('OMNILINK_ENABLED') === 'true';
    const baseUrl = Deno.env.get('OMNILINK_BASE_URL');
    const tenantId = Deno.env.get('OMNILINK_TENANT_ID');

    const baseResponse: HealthResponse = {
      status: 'disabled',
      details: {
        enabled,
        baseUrlConfigured: !!baseUrl,
        tenantConfigured: !!tenantId,
      },
      timestamp: new Date().toISOString(),
    };

    // If not enabled, return disabled status immediately
    if (!enabled) {
      console.log('[health-omnilink] Port is disabled');
      return new Response(JSON.stringify(baseResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check configuration completeness
    if (!baseUrl || !tenantId) {
      baseResponse.status = 'error';
      console.log('[health-omnilink] Misconfigured - missing baseUrl or tenantId');
      return new Response(JSON.stringify(baseResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Perform health check ping to the hub
    try {
      const startTime = performance.now();
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: {
          'X-Tenant-ID': tenantId,
          'X-API-Version': 'v1',
        },
        signal: AbortSignal.timeout(5000),
      });

      const latencyMs = Math.round(performance.now() - startTime);
      baseResponse.details.latencyMs = latencyMs;
      baseResponse.details.lastCheck = new Date().toISOString();

      if (response.ok) {
        baseResponse.status = 'ok';
        console.log(`[health-omnilink] Hub healthy, latency: ${latencyMs}ms`);
      } else {
        baseResponse.status = 'degraded';
        console.log(`[health-omnilink] Hub returned ${response.status}`);
      }
    } catch (hubError) {
      baseResponse.status = 'error';
      console.error('[health-omnilink] Hub unreachable:', hubError);
    }

    return new Response(JSON.stringify(baseResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[health-omnilink] Error:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        details: {
          enabled: false,
          baseUrlConfigured: false,
          tenantConfigured: false,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
