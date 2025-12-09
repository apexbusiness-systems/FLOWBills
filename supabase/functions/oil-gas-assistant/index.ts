import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// CORS headers for web app compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { assertLLMLock, DENO_ENDPOINT, DENO_MODEL_ID } from '../_shared/llm_guard.ts';

// Oil & Gas Query Validation
function validateOilGasQuery(query: string): void {
  if (!query || query.trim().length === 0) {
    throw new Error('Empty query not allowed');
  }

  if (query.length > 4000) {
    throw new Error('Query too long - max 4000 characters for safety');
  }

  // Log for audit trail (truncated for privacy)
  console.log(`🛢️ O&G Query validated: ${query.substring(0, 100)}...`);
}

// Industry-specific RAG retrieval
async function retrieveOilGasContext(query: string, supabase: any): Promise<string[]> {
  console.log('📚 Retrieving O&G industry context...');

  try {
    // Enhanced industry context with billing-specific knowledge
    const industryContext = [
      'WITSML (Wellsite Information Transfer Standard Markup Language) is the industry standard for drilling and completion data exchange.',
      'RESQML provides standardized data formats for subsurface reservoir models and geological interpretations.',
      'PRODML handles production data management with standardized schemas for hydrocarbon production reporting.',
      'SPE PRMS (Petroleum Resources Management System) defines reserves and resources classifications: 1P, 2P, 3P reserves.',
      'OSDU provides a common data platform for upstream oil and gas operations with standardized APIs.',
      'Joint Interest Billing (JIB) is the accounting process for allocating shared costs among working interest owners based on ownership percentages.',
      'Authorization for Expenditure (AFE) is a capital budgeting document that must be approved before commencing oil & gas projects.',
      'Field tickets are service verification documents that record actual work performed, including GPS-validated time, location, and equipment usage.',
      'Three-way matching validates Purchase Order, Field Ticket, and Invoice alignment before payment approval in oil & gas operations.',
      'CAPL (Canadian Association of Petroleum Landmen) establishes standard procedures and documentation for Canadian oil & gas operations.',
      'Master Service Agreements (MSA) define contracted rates and terms that must be validated against incoming invoices.',
      'Digital field ticketing platforms like OpenTicket enable real-time service verification with GPS validation and automated matching.',
      'Canadian Energy Regulator (CER) requires compliance reporting for interprovincial pipelines and international energy trade.',
      'Working interest percentages determine cost allocation in JIB, with operators billing non-operators for their proportionate share.',
      'AFE supplements and change orders must be approved when project costs exceed original authorized amounts.',
      'Price variance tolerance (typically 5-10%) determines when invoice amounts require additional approval in O&G AP workflows.',
      'UWI (Unique Well Identifier) links invoices to specific wells for accurate cost tracking and regulatory reporting in Canada.',
      'Day rates vs footage rates are common drilling pricing structures that affect invoice calculation and validation rules.',
      'HST/GST handling varies by province and service type, requiring accurate tax classification in Canadian O&G billing.',
      "Enverus OpenInvoice is the industry's largest e-invoicing network for oil & gas, enabling automated invoice submission and processing.",
    ];

    // Enhanced context matching with billing keywords
    const billingKeywords = [
      'invoice',
      'billing',
      'payment',
      'afe',
      'field ticket',
      'jib',
      'joint interest',
      'approval',
      'vendor',
      'cost',
      'budget',
      'pricing',
      'three-way',
      'matching',
      'capl',
      'msa',
      'purchase order',
      'po',
    ];

    const technicalKeywords = [
      'witsml',
      'resqml',
      'prodml',
      'osdu',
      'reserves',
      'prms',
      'drilling',
      'completion',
      'production',
      'well',
      'uwi',
    ];

    const queryLower = query.toLowerCase();

    // Prioritize billing context if query contains billing keywords
    const hasBillingKeyword = billingKeywords.some((kw) => queryLower.includes(kw));
    const hasTechnicalKeyword = technicalKeywords.some((kw) => queryLower.includes(kw));

    let relevantContext: string[];

    if (hasBillingKeyword) {
      // Prioritize billing-related context
      relevantContext = industryContext.filter((context) => {
        const contextLower = context.toLowerCase();
        return billingKeywords.some((kw) => contextLower.includes(kw));
      }).slice(0, 5);

      // Add some technical context if relevant
      if (hasTechnicalKeyword) {
        relevantContext = relevantContext.concat(
          industryContext.filter((context) => {
            const contextLower = context.toLowerCase();
            return technicalKeywords.some((kw) => contextLower.includes(kw));
          }).slice(0, 2),
        );
      }
    } else if (hasTechnicalKeyword) {
      // Technical query - focus on standards
      relevantContext = industryContext.filter((context) => {
        const contextLower = context.toLowerCase();
        return technicalKeywords.some((kw) => contextLower.includes(kw));
      }).slice(0, 5);
    } else {
      // General query - return mix of both
      relevantContext = industryContext.slice(0, 5);
    }

    console.log(`📊 Retrieved ${relevantContext.length} industry context chunks`);
    return relevantContext;
  } catch (error) {
    console.error('❌ RAG retrieval failed:', error);
    return [
      'No industry-specific context available. Please provide more specific technical details.',
    ];
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { query, user_id, context } = await req.json();

    // Validate the incoming query
    validateOilGasQuery(query);

    console.log(`🛢️ Processing O&G query for user: ${user_id || 'anonymous'}`);

    // Retrieve industry-specific context via RAG
    const industryContext = await retrieveOilGasContext(query, supabase);

    // Build system prompt with industry knowledge
    const systemPrompt =
      `You are FlowAi, a specialized Oil & Gas AI assistant with deep knowledge of industry standards, billing practices, and operational workflows in Canadian oil & gas.

TECHNICAL DATA STANDARDS:
- WITSML, RESQML, PRODML data standards
- OSDU platform and data models  
- SPE PRMS reserves/resources classification
- ISO 15926 asset lifecycle management
- PPDM petroleum data management

BILLING & FINANCIAL OPERATIONS EXPERTISE:

Joint Interest Billing (JIB):
- Multi-party expense allocation based on working interest ownership
- Cost distribution among operators and non-operators
- JOA (Joint Operating Agreement) compliance
- Transparent partner reporting and settlement
- AFE-based cost tracking across joint ventures

Authorization for Expenditure (AFE):
- Capital project budgeting and authorization
- Multi-stage approval workflows (proposal → approval → execution)
- Budget vs actual variance tracking
- Change orders and supplements
- Cost center and GL code allocation
- Integration with project management systems

Field Ticket Management:
- Service verification documentation from field operations
- Digital field tickets with GPS validation
- Time and materials tracking (personnel hours, equipment usage)
- Service provider sign-off and validation
- Critical input for three-way matching process
- Integration platforms: OpenTicket, FieldVest

Three-Way Match Validation:
Step 1: Purchase Order (PO) - contracted services or materials
Step 2: Field Ticket/Receiving - actual services performed or goods received
Step 3: Vendor Invoice - billing for services/materials
All three must reconcile before payment authorization

Vendor & Contract Management:
- Master Service Agreements (MSA) and rate cards
- Pricing compliance validation against contracted rates
- Vendor performance scorecards
- Prequalification and vendor setup requirements
- Insurance and safety compliance verification
- Early payment discount programs (2/10 net 30)

Invoice Processing Workflow:
1. Receipt and data capture (OCR/EDI)
2. AFE budget verification
3. PO and field ticket matching
4. Pricing and rate validation
5. GL coding and cost allocation
6. Approval routing (amount-based thresholds)
7. Payment processing
8. Partner billing for joint ventures

Canadian Regulatory Compliance:
- CAPL (Canadian Association of Petroleum Landmen) standards
- CER (Canada Energy Regulator) reporting
- Provincial regulations: Alberta (AER), Saskatchewan (SRC), BC (BCOGC)
- HST/GST handling and reconciliation
- T4/T5 year-end reporting for contractors
- Environmental levy tracking (TIER, OBPS)

Common Service Categories:
- Drilling: day rates, footage rates, casing running
- Completion: fracturing stages, coiled tubing, cementing
- Production: well servicing, workover, maintenance
- Facilities: compression, processing, treating
- Equipment: rig rental, pump rental, tank rental
- Consulting: engineering, geology, land services
- Logistics: hauling, disposal, pipeline services

Exception Management:
- Price variance beyond tolerance (typically 5-10%)
- AFE budget overrun alerts
- Missing or invalid field tickets
- Duplicate invoice detection across AFEs/vendors
- Unapproved vendor invoices
- Tax code misclassification
- Invalid cost center or GL codes

ERP System Integrations:
- SAP Oil & Gas modules
- Oracle E-Business Suite
- Microsoft Dynamics 365
- Quorum Execute AFE
- Enverus OpenInvoice/OpenTicket
- P2 Energy Solutions
- WolfePak ERP

Industry-Specific Invoice Elements:
- AFE number and well identifier (UWI)
- Working interest percentage splits
- Cost center/cost pool allocation
- Service date ranges and location (LSD/DLS)
- Equipment ID and serial numbers
- Ticket numbers and authorization codes
- Unit rates and quantities
- HST/GST breakdown by province

RESPONSE REQUIREMENTS:
- Always cite industry standards when applicable (CAPL, OSDU, SPE, CER)
- Use proper O&G terminology and Canadian units (metres, m³, GJ, BOE)
- Reference specific billing processes (JIB, AFE, three-way match)
- Provide actionable workflow guidance
- Consider Canadian regulatory requirements
- Maintain confidentiality and data security
- Provide technical accuracy with industry context

RETRIEVED CONTEXT:
${industryContext.join('\n\n')}

Remember: You must provide citations for any industry-specific claims. If you cannot provide a reliable citation, ask the user to upload relevant documentation.`;

    // Prepare messages for the LLM
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
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
      console.error('❌ OpenAI API error:', errorData);
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
        context_chunks: industryContext.length,
      },
    });

    console.log('✅ O&G assistant response generated successfully');

    return new Response(
      JSON.stringify({
        response,
        citations: industryContext,
        model: Deno.env.get('LLM_MODEL_ID'),
        context_used: industryContext.length > 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('❌ Oil & Gas Assistant error:', error);

    // Security: Never expose internal details in production
    const errorMessage = (error as Error).message?.includes('SECURITY:')
      ? 'LLM security system active - access denied'
      : 'Oil & Gas assistant temporarily unavailable';

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: Deno.env.get('NODE_ENV') === 'development' ? (error as Error).message : undefined,
      }),
      {
        status: (error as Error).message?.includes('SECURITY:') ? 503 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
