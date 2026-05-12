import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = Deno.env.get('ALLOWED_ORIGINS')
  ?.split(',').map(o => o.trim()).filter(Boolean) ?? [];

function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.length === 0
    ? '*'
    : (ALLOWED_ORIGINS.includes(origin) ? origin : '');
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// Use constants/env for model boundaries
const MODEL_ID = Deno.env.get('SUPPORT_MODEL_ID') || "gpt-4o-realtime-preview-2024-12-17";
const WS_ENDPOINT = Deno.env.get('SUPPORT_REALTIME_ENDPOINT') || `wss://api.openai.com/v1/realtime?model=${MODEL_ID}`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  // Ensure this is a WebSocket request
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response(JSON.stringify({ error: "WebSocket upgrade required" }), {
      status: 400,
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
    });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get('Authorization') || '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
    // We only create the client to verify the token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY");
    }

    // Accept the client WebSocket connection
    const { socket: clientWebSocket, response } = Deno.upgradeWebSocket(req);

    // Connect to OpenAI Realtime API
    // Using current transport as requested but abstracting the URL
    const openaiWebSocket = new WebSocket(
        WS_ENDPOINT,
        ["realtime", `openai-insecure-api-key.${OPENAI_API_KEY}`, "openai-beta.realtime-v1"]
    );

    // Setup adapter seam (future WebRTC upgrade path)
    const adapter = {
      sendToClient: (data: string | ArrayBuffer) => {
        if (clientWebSocket.readyState === WebSocket.OPEN) {
          clientWebSocket.send(data);
        }
      },
      sendToModel: (data: string | ArrayBuffer) => {
        if (openaiWebSocket.readyState === WebSocket.OPEN) {
          openaiWebSocket.send(data);
        }
      }
    };

    // Relay messages from OpenAI to Client
    openaiWebSocket.onmessage = (event) => {
      adapter.sendToClient(event.data);
    };

    // Relay messages from Client to OpenAI
    clientWebSocket.onmessage = (event) => {
      adapter.sendToModel(event.data);
    };

    // Handle initialization when OpenAI connection opens
    openaiWebSocket.onopen = () => {
      console.log("Connected to OpenAI Realtime API");

      // Initialize the session with specific instructions for FLOWBills Support
      const initMessage = {
        type: "session.update",
        session: {
          instructions: `You are a 24/7 AI support assistant for FLOWBills, an intelligent invoice processing platform specifically designed for Canadian oil & gas operations.

          Your goal is to help users with:
          - Invoice ingestion and processing workflows
          - AFE (Authority for Expenditure) budget tracking and variance
          - Field ticket validation and 3-way matching
          - Duplicate detection and resolution
          - Vendor management and compliance
          - User roles, permissions, and approval workflows

          Keep your responses concise, helpful, and professional. You are speaking directly with the user.
          Do not hallucinate features. If asked about features not currently supported, honestly state they are not available yet.

          Key FLOWBills terminology:
          - 'STP' means Straight-Through Processing (invoices approved without human intervention)
          - 'HIL' means Human-in-the-Loop (when invoices need manual review)
          - 'UWI' means Unique Well Identifier
          `,
          voice: "alloy",
          input_audio_format: "pcm16",
          output_audio_format: "pcm16",
          input_audio_transcription: {
            model: "whisper-1"
          },
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 200,
          }
        }
      };

      adapter.sendToModel(JSON.stringify(initMessage));
    };

    // Error handling
    openaiWebSocket.onerror = (error) => {
      console.error("OpenAI WebSocket Error:", error);
      adapter.sendToClient(JSON.stringify({
        type: "error", 
        error: { message: "Connection to AI service failed" }
      }));
    };

    clientWebSocket.onerror = (error) => {
      console.error("Client WebSocket Error:", error);
    };

    // Cleanup on close
    openaiWebSocket.onclose = () => {
      console.log("OpenAI WebSocket Closed");
      if (clientWebSocket.readyState === WebSocket.OPEN) {
        clientWebSocket.close(1000, "AI service disconnected");
      }
    };

    clientWebSocket.onclose = () => {
      console.log("Client WebSocket Closed");
      if (openaiWebSocket.readyState === WebSocket.OPEN) {
        openaiWebSocket.close(1000, "Client disconnected");
      }
    };

    return response;

  } catch (err: any) {
    console.error("Error setting up WebSocket:", err);
    return new Response(JSON.stringify({ error: "Internal server error", message: err.message }), {
      status: 500,
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
    });
  }
});
