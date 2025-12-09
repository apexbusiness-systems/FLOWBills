import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BUCKET = new Map<string, { tokens: number; ts: number }>();
const RATE = { refillPerSec: 1, burst: 10 };

function take(key: string): boolean {
  const now = Date.now() / 1000;
  const s = BUCKET.get(key) ?? { tokens: RATE.burst, ts: now };
  const refill = Math.max(0, now - s.ts) * RATE.refillPerSec;
  s.tokens = Math.min(RATE.burst, s.tokens + refill);
  s.ts = now;
  if (s.tokens < 1) {
    BUCKET.set(key, s);
    return false;
  }
  s.tokens -= 1;
  BUCKET.set(key, s);
  return true;
}

function userIdFromAuth(req: Request): Promise<string | null> {
  // Simplified auth extraction
  return Promise.resolve(req.headers.get('x-user-id') || null);
}

function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    'unknown';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client for auth verification
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limiting
    const userId = (await userIdFromAuth(req)) ?? clientIp(req);
    if (!take(userId)) {
      return new Response('Too Many Requests', {
        status: 429,
        headers: corsHeaders,
      });
    }

    // Get auth token from request
    const authToken = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authToken) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);
    if (authError || !user) {
      console.error('Auth verification failed:', authError);
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt, context } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log the request for security monitoring
    console.log(`AI Assistant request from user: ${user.id}, prompt length: ${prompt.length}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              `You are FlowAi, a specialized AI assistant for oil & gas billing and invoice processing in Canadian operations.

INDUSTRY EXPERTISE - Oil & Gas Billing:

Joint Interest Billing (JIB):
- Multi-party cost sharing based on working interest percentages
- Transparent partner allocation and distribution
- Automated cost breakdowns by AFE or well identifier
- Compliance with joint operating agreements (JOA)

Authorization for Expenditure (AFE):
- Pre-approved capital expenditure budgets
- Project-based cost tracking and variance analysis
- Approval workflow tied to AFE limits
- Budget vs actual spend monitoring
- Change order and supplement management

Field Ticket Validation:
- Service verification from field operations
- GPS-validated time and location data
- Equipment usage and personnel hours tracking
- Critical component of three-way match process
- Integration with digital ticketing platforms (OpenTicket)

Three-Way Matching:
1. Purchase Order (PO) - contracted services/materials
2. Field Ticket - actual services performed/delivered
3. Invoice - vendor billing document
Must all align before payment approval

Vendor & Pricing Management:
- Master Service Agreements (MSA) compliance
- Rate card validation for standard services
- Pricing agreement enforcement
- Vendor performance tracking
- Early payment discount opportunities

Canadian Regulatory Compliance:
- CAPL standards adherence
- CER reporting requirements
- Provincial regulations (AB, SK, BC)
- HST/GST handling for services
- 1099/T4 year-end reporting

Common Invoice Types:
- Drilling services (day rates, footage rates)
- Completion services (stages, perforations)
- Production operations (processing, compression)
- Equipment rentals (rigs, pumps, tanks)
- Consulting and professional services
- Material and supply purchases
- Transportation and logistics

Exception Handling:
- Price variances outside tolerance
- AFE budget overruns
- Missing or invalid field tickets
- Duplicate invoice detection
- Vendor setup and registration issues
- Tax classification errors

Workflow Automation:
- Threshold-based approval routing
- AFE budget holder notifications
- Joint venture partner approvals
- Automated GL coding and cost center allocation
- Integration with ERP systems (SAP, Oracle, NetSuite)

RESPONSE GUIDELINES:
- Use proper oil & gas terminology
- Reference industry standards (CAPL, OSDU, SPE)
- Maintain data security and confidentiality
- Provide actionable, specific guidance
- Cite Canadian regulations when applicable
${context ? `\nAdditional Context: ${context}` : ''}`,
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI service temporarily unavailable' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content;

    if (!generatedText) {
      console.error('No response from OpenAI');
      return new Response(JSON.stringify({ error: 'No response generated' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        response: generatedText,
        usage: data.usage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
