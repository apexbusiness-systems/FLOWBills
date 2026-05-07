/**
 * Configuration for AI models and assistants.
 * Externalizes hardcoded model IDs and endpoints into a single boundary.
 */

export const AI_CONFIG = {
  // Support Chat
  support: {
    modelId: import.meta.env.VITE_SUPPORT_MODEL_ID || "gpt-4o-realtime-preview-2024-10-01",
    voice: "alloy",
    transcriptionModel: "whisper-1",
  },
  // Oil & Gas Assistant
  oilGas: {
    modelId: import.meta.env.VITE_OIL_GAS_MODEL_ID || "gpt-4o-mini",
  },
  // Endpoints
  endpoints: {
    supportChat: "https://api.openai.com/v1/realtime",
  }
};
