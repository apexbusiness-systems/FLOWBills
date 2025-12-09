import 'https://deno.land/x/xhr@0.1.0/mod.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

Deno.serve((req) => {
  if (req.headers.get('upgrade') !== 'websocket') {
    return new Response('Expected WebSocket', { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  let openAIWs: WebSocket | null = null;

  socket.onopen = () => {
    console.log('Client connected to support chat');

    try {
      // Connect to OpenAI Realtime API
      // Note: Deno WebSocket doesn't support headers in constructor, use subprotocol array
      openAIWs = new WebSocket(
        'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
        ['realtime', `openai-insecure-api-key.${OPENAI_API_KEY}`, 'openai-beta.realtime-v1'],
      );

      openAIWs.onopen = () => {
        console.log('Connected to OpenAI Realtime API');
      };

      openAIWs.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('OpenAI message:', data.type);

        // Send session update after receiving session.created
        if (data.type === 'session.created') {
          const sessionConfig = {
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions:
                `You are a 24/7 AI support assistant for FlowAi, an intelligent invoice processing platform specifically designed for Canadian oil & gas operations. 

YOUR ROLE:
- Answer general product questions about FlowAi features and capabilities
- Provide technical support and troubleshooting guidance
- Help with account and billing inquiries
- Guide users through onboarding and training
- Explain industry-specific billing concepts and workflows

INDUSTRY-SPECIFIC KNOWLEDGE:

Joint Interest Billing (JIB):
- Specialized accounting for shared expenses among partners/working interest owners
- Multiple parties share costs based on ownership percentages
- Requires accurate allocation and transparent reporting
- FlowAi automates cost allocation and partner distribution

Authorization for Expenditure (AFE):
- Capital expenditure approval workflow critical in oil & gas
- Pre-authorization required before work begins
- Tracks approved vs actual spend for project management
- FlowAi validates invoices against AFE budgets and tracks variances

Field Tickets:
- Service verification documents from oilfield operations
- Time tracking and equipment usage records
- GPS-validated location and duration data
- Critical for three-way matching: Field Ticket → Purchase Order → Invoice
- FlowAi integrates field ticket validation before invoice approval

Three-Way Matching Process:
1. Purchase Order (PO) - what was ordered
2. Field Ticket - what service was actually performed
3. Invoice - what vendor is charging
- FlowAi automatically validates all three documents match

Canadian Standards & Compliance:
- CAPL (Canadian Association of Petroleum Landmen) standards
- Provincial regulatory requirements (Alberta, Saskatchewan, BC)
- CER (Canada Energy Regulator) reporting compliance
- FlowAi ensures adherence to Canadian regulatory frameworks

Vendor Management:
- Pricing agreement compliance validation
- Master Service Agreements (MSA) enforcement
- Rate card verification for common services
- FlowAi flags pricing discrepancies automatically

Approval Workflows:
- Multi-level approvals based on invoice amount thresholds
- AFE budget holder approvals for capital expenditures
- Joint venture partner notifications
- FlowAi provides configurable workflow automation

KEY PRODUCT FEATURES:
- AI-powered OCR for invoices and field tickets
- Automated AFE budget tracking and variance reporting
- JIB cost allocation and partner distribution
- Three-way matching automation (PO, Field Ticket, Invoice)
- Duplicate detection and fraud prevention
- Real-time compliance validation
- Integration with OpenInvoice/OpenTicket platforms
- GPS-verified field service validation
- Peppol e-invoicing standards support
- Automated exception handling and routing

COMMON USE CASES:
- Drilling operations invoicing
- Completion and production service billing
- Equipment rental tracking and billing
- Consultant and contractor time validation
- Material and supply invoicing
- Joint venture cost allocations

Be helpful, professional, and industry-knowledgeable. Use proper oil & gas terminology. If you don't know something specific, be honest and offer to escalate to human support.`,
              voice: 'alloy',
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              input_audio_transcription: {
                model: 'whisper-1',
              },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 1000,
              },
              temperature: 0.8,
              max_response_output_tokens: 4096,
            },
          };
          openAIWs?.send(JSON.stringify(sessionConfig));
          console.log('Session configuration sent');
        }

        // Forward all messages to client
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(event.data);
        }
      };

      openAIWs.onerror = (error) => {
        console.error('OpenAI WebSocket error:', error);
        socket.send(JSON.stringify({
          type: 'error',
          error: 'Connection to AI service failed',
        }));
      };

      openAIWs.onclose = () => {
        console.log('OpenAI WebSocket closed');
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      };
    } catch (error) {
      console.error('Error connecting to OpenAI:', error);
      socket.send(JSON.stringify({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  socket.onmessage = (event) => {
    if (openAIWs?.readyState === WebSocket.OPEN) {
      openAIWs.send(event.data);
    }
  };

  socket.onclose = () => {
    console.log('Client disconnected');
    openAIWs?.close();
  };

  socket.onerror = (error) => {
    console.error('Client WebSocket error:', error);
    openAIWs?.close();
  };

  return response;
});
