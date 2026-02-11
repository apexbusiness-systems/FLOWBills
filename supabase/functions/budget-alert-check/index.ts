import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { processBudgetAlerts, ResendEmailParams } from "./core.ts";

// Resend client - only initialize if API key is configured
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Simple Resend API wrapper using fetch with exponential backoff retry
async function sendEmail(params: ResendEmailParams): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn('[budget-alert-check] RESEND_API_KEY not configured, skipping email');
    return false;
  }
  
  const MAX_RETRIES = 3;
  let lastError: any;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (response.ok) {
        return true;
      }

      // If rate limited or server error, we might want to retry
      // 429 Too Many Requests
      // 5xx Server Error
      if (response.status === 429 || response.status >= 500) {
        const errorText = await response.text();
        console.warn(`[budget-alert-check] Resend API error (attempt ${attempt + 1}/${MAX_RETRIES + 1}): ${response.status} - ${errorText}`);
        lastError = new Error(`Resend API error: ${response.status} - ${errorText}`);
      } else {
        // Client error (400, 401, etc) - do not retry
        const errorText = await response.text();
        console.error(`[budget-alert-check] Resend API client error: ${response.status} - ${errorText}`);
        return false;
      }

    } catch (error) {
      console.warn(`[budget-alert-check] Failed to send email (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, error);
      lastError = error;
    }

    // Exponential backoff if we are going to retry
    if (attempt < MAX_RETRIES) {
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error('[budget-alert-check] Failed to send email after retries:', lastError);
  return false;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Starting budget alert check...');

    const metrics = await processBudgetAlerts(supabase, sendEmail);

    console.log(`Budget alert check complete. ${metrics.alerts_triggered} alerts triggered in ${metrics.duration_ms.toFixed(0)}ms.`);

    return new Response(
      JSON.stringify({
        success: true,
        metrics
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in budget-alert-check:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
