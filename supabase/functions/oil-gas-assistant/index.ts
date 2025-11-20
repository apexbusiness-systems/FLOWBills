import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// CORS headers for web app compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { assertLLMLock, DENO_MODEL_ID, DENO_ENDPOINT } from "../_shared/llm_guard.ts";

// Oil & Gas Query Validation
function validateOilGasQuery(query: string): void {
  if (!query || query.trim().length === 0) {
    throw new Error("Empty query not allowed");
  }

  if (query.length > 4000) {
    throw new Error("Query too long - max 4000 characters for safety");
  }

  // Log for audit trail (truncated for privacy)
  console.log(`🛢️ O&G Query validated: ${query.substring(0, 100)}...`);
}

// Industry-specific RAG retrieval
async function retrieveOilGasContext(query: string, supabase: any): Promise<string[]> {
  console.log("📚 Retrieving O&G industry context...");
  
  try {
    // This would integrate with vector search in production
    // For now, return industry-specific context snippets
    const industryContext = [
      "WITSML (Wellsite Information Transfer Standard Markup Language) is the industry standard for drilling and completion data exchange.",
      "RESQML provides standardized data formats for subsurface reservoir models and geological interpretations.",
      "PRODML handles production data management with standardized schemas for hydrocarbon production reporting.",
      "SPE PRMS (Petroleum Resources Management System) defines reserves and resources classifications: 1P, 2P, 3P reserves.",
      "OSDU provides a common data platform for upstream oil and gas operations with standardized APIs."
    ];

    // In production, this would use vector similarity search
    const relevantContext = industryContext.filter(context => 
      query.toLowerCase().includes('witsml') && context.includes('WITSML') ||
      query.toLowerCase().includes('resqml') && context.includes('RESQML') ||
      query.toLowerCase().includes('prodml') && context.includes('PRODML') ||
      query.toLowerCase().includes('reserves') && context.includes('PRMS') ||
      query.toLowerCase().includes('osdu') && context.includes('OSDU') ||
      true // Return all for general queries
    ).slice(0, 3);

    console.log(`📊 Retrieved ${relevantContext.length} industry context chunks`);
    return relevantContext;
    
  } catch (error) {
    console.error("❌ RAG retrieval failed:", error);
    return ["No industry-specific context available. Please provide more specific technical details."];
  }
}

// Main Oil & Gas Assistant Handler
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Security: Verify LLM lock before any processing
    assertLLMLock();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { query, user_id, context } = await req.json();
    
    // Validate the incoming query
    validateOilGasQuery(query);

    console.log(`🛢️ Processing O&G query for user: ${user_id || 'anonymous'}`);

    // Retrieve industry-specific context via RAG
    const industryContext = await retrieveOilGasContext(query, supabase);

    // Build system prompt with industry knowledge
    const systemPrompt = `You are FlowAi, a specialized Oil & Gas AI assistant with deep knowledge of industry standards and practices.

INDUSTRY EXPERTISE:
- WITSML, RESQML, PRODML data standards
- OSDU platform and data models  
- SPE PRMS reserves/resources classification
- ISO 15926 asset lifecycle management
- PPDM petroleum data management

RESPONSE REQUIREMENTS:
- Always cite industry standards when applicable
- Use proper O&G terminology and units
- Follow SPE PRMS classification for reserves discussions
- Reference OSDU entities when discussing data management
- Provide technical accuracy with industry context

RETRIEVED CONTEXT:
${industryContext.join('\n\n')}

Remember: You must provide citations for any industry-specific claims. If you cannot provide a reliable citation, ask the user to upload relevant documentation.`;

    // Prepare messages for the LLM
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query }
    ];

    // Add conversation context if provided
    if (context && Array.isArray(context)) {
      messages.splice(1, 0, ...context);
    }

    // Call OpenAI API (locked to specific model)
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DENO_MODEL_ID,
        messages: messages,
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 2048,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.text();
      console.error("❌ OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const data = await openAIResponse.json();
    const response = data.choices[0].message.content;

    // Log interaction for audit trail
    await supabase.from('audit_logs').insert({
      action: 'OIL_GAS_QUERY',
      entity_type: 'ai_assistant',
      entity_id: crypto.randomUUID(),
      user_id: user_id || null,
      new_values: {
        query: query.substring(0, 200), // Truncated for privacy
        model: Deno.env.get('LLM_MODEL_ID'),
        response_length: response.length,
        context_chunks: industryContext.length
      }
    });

    console.log("✅ O&G assistant response generated successfully");

    return new Response(JSON.stringify({ 
      response,
      citations: industryContext,
      model: Deno.env.get('LLM_MODEL_ID'),
      context_used: industryContext.length > 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Oil & Gas Assistant error:', error);
    
    // Security: Never expose internal details in production
    const errorMessage = (error as Error).message?.includes('SECURITY:') 
      ? 'LLM security system active - access denied'
      : 'Oil & Gas assistant temporarily unavailable';

    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: Deno.env.get('NODE_ENV') === 'development' ? (error as Error).message : undefined
    }), {
      status: (error as Error).message?.includes('SECURITY:') ? 503 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});