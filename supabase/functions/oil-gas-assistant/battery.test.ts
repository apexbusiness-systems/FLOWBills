
import { assertEquals, assert, assertRejects } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { validateOilGasQuery, retrieveOilGasContext, handler } from "./index.ts";

// =============================================================================
// TEST CONFIGURATION
// =============================================================================

const TEST_CONFIG = {
  CONCURRENT_USERS: 20,
  REQUESTS_PER_USER: 5,
  SPIKE_USERS: 50,
  ENDURANCE_DURATION_MS: 1000,
};

// =============================================================================
// TEST UTILITIES
// =============================================================================

function generateRequestId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Mock Supabase Client
const mockSupabase = {
  from: (table: string) => ({
    insert: (data: any) => Promise.resolve({ data: null, error: null }),
  }),
};

import { setCreateClientFn } from "./index.ts";

// Override createClient for tests
setCreateClientFn(((url: string, key: string) => mockSupabase) as any);

// Mock Deno.env
const originalEnv = Deno.env.toObject();
const mockEnv = {
  LLM_LOCK: "1",
  OPENAI_API_KEY: "test-key",
  LLM_MODEL_ID: "gpt-4o-mini",
  LLM_PROVIDER: "openai",
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-key",
  NODE_ENV: "test",
};

function setupEnv() {
  for (const [key, value] of Object.entries(mockEnv)) {
    Deno.env.set(key, value);
  }
}

function teardownEnv() {
  for (const key of Object.keys(mockEnv)) {
    Deno.env.delete(key);
  }
  for (const [key, value] of Object.entries(originalEnv)) {
    Deno.env.set(key, value);
  }
}

// Mock fetch
const originalFetch = globalThis.fetch;
function mockFetch(responseBody: any, status = 200, ok = true) {
  globalThis.fetch = async () => new Response(JSON.stringify(responseBody), { status, statusText: ok ? "OK" : "Error" });
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

// =============================================================================
// UNIT TESTS - Helper Functions
// =============================================================================

Deno.test("Validation: accepts valid queries", () => {
  validateOilGasQuery("What is the WITSML standard?");
  validateOilGasQuery("How to process a JIB invoice?");
});

Deno.test("Validation: rejects empty queries", () => {
  try {
    validateOilGasQuery("");
    assert(false, "Should throw error for empty query");
  } catch (e) {
    assert(e instanceof Error);
  }

  try {
    validateOilGasQuery("   ");
    assert(false, "Should throw error for empty query");
  } catch (e) {
    assert(e instanceof Error);
  }
});

Deno.test("Validation: rejects too long queries", () => {
  const longQuery = "a".repeat(4001);
  try {
    validateOilGasQuery(longQuery);
    assert(false, "Should throw error for too long query");
  } catch (e) {
    assert(e instanceof Error);
  }
});

Deno.test("Context Retrieval: retrieves billing context", async () => {
  const context = await retrieveOilGasContext("invoice approval process", mockSupabase as any);
  assert(context.some(c => c.toLowerCase().includes("invoice")), "Should retrieve invoice context");
});

Deno.test("Context Retrieval: retrieves technical context", async () => {
  const context = await retrieveOilGasContext("WITSML data format", mockSupabase as any);
  assert(context.some(c => c.toLowerCase().includes("witsml")), "Should retrieve WITSML context");
});

// =============================================================================
// LOAD TESTING - Concurrent Request Handling
// =============================================================================

Deno.test("LoadTest: handles concurrent requests", async () => {
  setupEnv();
  mockFetch({ choices: [{ message: { content: "Test response" } }] });

  const concurrentRequests = TEST_CONFIG.CONCURRENT_USERS;
  let successes = 0;
  let failures = 0;

  const requests = Array.from({ length: concurrentRequests }, async (_, i) => {
    try {
      const req = new Request("http://localhost/oil-gas-assistant", {
        method: "POST",
        body: JSON.stringify({ query: `Test query ${i}`, user_id: `user-${i}` }),
      });
      const res = await handler(req);
      if (res.status === 200) {
        successes++;
      } else {
        failures++;
      }
    } catch (e) {
      failures++;
    }
  });

  await Promise.all(requests);

  console.log(`[LoadTest] Concurrent requests: Success: ${successes}, Failed: ${failures}`);
  assertEquals(failures, 0, "All concurrent requests should succeed");

  teardownEnv();
  restoreFetch();
});

// =============================================================================
// STRESS TESTING
// =============================================================================

Deno.test("StressTest: handles maximum payload size", () => {
  const maxPayload = "A".repeat(4000);
  validateOilGasQuery(maxPayload); // Should not throw
});

Deno.test("StressTest: rapid sequential calls", async () => {
    setupEnv();
    mockFetch({ choices: [{ message: { content: "Test response" } }] });

    const iterations = 50;
    let successes = 0;

    for (let i = 0; i < iterations; i++) {
        const req = new Request("http://localhost/oil-gas-assistant", {
            method: "POST",
            body: JSON.stringify({ query: "Test query", user_id: "user-1" }),
        });
        const res = await handler(req);
        if (res.status === 200) successes++;
    }

    console.log(`[StressTest] Rapid sequential calls: ${successes}/${iterations}`);
    assertEquals(successes, iterations);

    teardownEnv();
    restoreFetch();
});

// =============================================================================
// SECURITY TESTING
// =============================================================================

Deno.test("Security: enforces LLM lock", async () => {
  setupEnv();
  Deno.env.set("LLM_LOCK", "0"); // Disable lock

  const req = new Request("http://localhost/oil-gas-assistant", {
    method: "POST",
    body: JSON.stringify({ query: "Test query" }),
  });

  const res = await handler(req);
  assertEquals(res.status, 503, "Should block access when LLM lock is disabled");

  teardownEnv();
});

Deno.test("Security: handles missing env vars", async () => {
    setupEnv();
    Deno.env.delete("OPENAI_API_KEY");

    const req = new Request("http://localhost/oil-gas-assistant", {
      method: "POST",
      body: JSON.stringify({ query: "Test query" }),
    });

    const res = await handler(req);
    // Depending on error handling implementation, might be 503 or 500. Code says 503 if security related.
    // The error message for missing env var starts with "SECURITY:" in llm_guard.ts
    assertEquals(res.status, 503, "Should fail safely when API key is missing");

    teardownEnv();
});

// =============================================================================
// INTEGRATION / E2E FLOW
// =============================================================================

Deno.test("E2E: Full flow with context and logging", async () => {
    setupEnv();

    // Mock OpenAI response
    mockFetch({ choices: [{ message: { content: "Based on WITSML standards..." } }] });

    const req = new Request("http://localhost/oil-gas-assistant", {
        method: "POST",
        body: JSON.stringify({
            query: "Explain WITSML",
            user_id: "test-user",
            context: [{ role: "user", content: "Previous message" }]
        }),
    });

    const res = await handler(req);
    assertEquals(res.status, 200);

    const data = await res.json();
    assert(data.response.includes("WITSML"), "Response should contain expected content");
    assert(data.citations.length > 0, "Citations should be provided");
    assertEquals(data.model, "gpt-4o-mini", "Should return used model");

    teardownEnv();
    restoreFetch();
});

// =============================================================================
// PRODUCTION READINESS SUMMARY
// =============================================================================

Deno.test("ProductionReadiness: summary", () => {
    console.log("\n" + "=".repeat(60));
    console.log("OIL & GAS ASSISTANT BATTERY TEST SUMMARY");
    console.log("=".repeat(60));
    console.log("All tests passed implies system is resilient and secure.");
    console.log("=".repeat(60) + "\n");
});
