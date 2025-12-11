// LLM Security Guard - Prevents model/endpoint overrides
export function assertLLMLock() {
  console.log("🔒 Verifying LLM security lock...");
  
  if (Deno.env.get('LLM_LOCK') !== "1") {
    throw new Error("SECURITY: LLM_LOCK disabled - model access denied");
  }

  const requiredEnvs = ['OPENAI_API_KEY', 'LLM_MODEL_ID', 'LLM_PROVIDER'];
  for (const env of requiredEnvs) {
    if (!Deno.env.get(env)) {
      throw new Error(`SECURITY: Missing required environment variable: ${env}`);
    }
  }

  console.log("✅ LLM security lock verified");
}

export const DENO_MODEL_ID = Deno.env.get('LLM_MODEL_ID') || 'gpt-4o-mini';
export const DENO_ENDPOINT = 'https://api.openai.com/v1/chat/completions';