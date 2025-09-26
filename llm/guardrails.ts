import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface LLMManifest {
  name: string;
  provider: string;
  endpoint: string;
  model_id: string;
  adapter: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
  rag: boolean;
  reference_policy: string;
  checksum_sha256: string;
}

export function assertLLMLock(): LLMManifest {
  // Check if LLM lock is enabled
  if (process.env.LLM_LOCK !== "1") {
    throw new Error("SECURITY: LLM_LOCK disabled - oil & gas model access denied");
  }

  try {
    // Read and parse manifest
    const manifestPath = join(process.cwd(), "llm/manifest.json");
    const manifestContent = readFileSync(manifestPath, "utf-8");
    const manifest: LLMManifest = JSON.parse(manifestContent);

    // Verify checksum integrity
    const actualChecksum = createHash("sha256")
      .update(manifestContent)
      .digest("hex");
    
    if (actualChecksum !== manifest.checksum_sha256) {
      throw new Error(`SECURITY: LLM manifest checksum mismatch - expected ${manifest.checksum_sha256}, got ${actualChecksum}`);
    }

    // Verify environment variables match manifest
    if (process.env.LLM_MODEL_ID !== manifest.model_id) {
      throw new Error(`SECURITY: Model ID drift - env: ${process.env.LLM_MODEL_ID}, manifest: ${manifest.model_id}`);
    }

    if (process.env.LLM_PROVIDER !== manifest.provider) {
      throw new Error(`SECURITY: Provider drift - env: ${process.env.LLM_PROVIDER}, manifest: ${manifest.provider}`);
    }

    console.log(`✅ LLM security lock verified: ${manifest.name} with model ${manifest.model_id}`);
    return manifest;

  } catch (error) {
    console.error("❌ LLM security lock failed:", error);
    throw new Error(`SECURITY: LLM guardrails failure - ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}

export function validateOilGasQuery(query: string): void {
  // Basic input validation for O&G queries
  if (!query || query.trim().length === 0) {
    throw new Error("Empty query not allowed");
  }

  if (query.length > 4000) {
    throw new Error("Query too long - max 4000 characters");
  }

  // Log query for audit (non-PII)
  console.log(`🛢️ O&G Query validated: ${query.substring(0, 100)}...`);
}