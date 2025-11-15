/**
 * CSP Violation Report Endpoint
 * Receives CSP violation reports via navigator.sendBeacon
 */

import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse the violation report
    const violation = await req.json();

    console.log('CSP Violation received:', {
      blockedURI: violation.blocked_uri,
      violatedDirective: violation.violated_directive,
      disposition: violation.disposition
    });

    // Store in database
    const { error } = await supabase
      .from('csp_violations')
      .insert({
        blocked_uri: violation.blocked_uri,
        violated_directive: violation.violated_directive,
        original_policy: violation.original_policy,
        disposition: violation.disposition,
        document_uri: violation.document_uri,
        user_agent: violation.user_agent,
        timestamp: violation.timestamp || new Date().toISOString(),
        metadata: {
          ...violation,
          received_at: new Date().toISOString()
        }
      });

    if (error) {
      console.error('Error storing CSP violation:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Violation report received' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('CSP report endpoint error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
