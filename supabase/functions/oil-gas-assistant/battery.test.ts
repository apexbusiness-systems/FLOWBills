
import { assertEquals, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { validateOilGasQuery, retrieveOilGasContext, processOilGasRequest, OilGasResponse } from "./core.ts";

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

// Mock Supabase Client
const mockSupabase = {
  from: (_table: string) => ({
    insert: (_data: any) => Promise.resolve({ data: null, error: null }),
  }),
};

// Mock Environment
const mockEnv = {
  LLM_LOCK: "1",
  OPENAI_API_KEY: "test-key",
  LLM_MODEL_ID: "gpt-4o-mini",
  LLM_PROVIDER: "openai",
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-key",
  NODE_ENV: "test",
};

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
      const res = await processOilGasRequest(req, mockSupabase as any, mockEnv);
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
    mockFetch({ choices: [{ message: { content: "Test response" } }] });

    const iterations = 50;
    let successes = 0;

    for (let i = 0; i < iterations; i++) {
        const req = new Request("http://localhost/oil-gas-assistant", {
            method: "POST",
            body: JSON.stringify({ query: "Test query", user_id: "user-1" }),
        });
        const res = await processOilGasRequest(req, mockSupabase as any, mockEnv);
        if (res.status === 200) successes++;
    }

    console.log(`[StressTest] Rapid sequential calls: ${successes}/${iterations}`);
    assertEquals(successes, iterations);

    restoreFetch();
});

// =============================================================================
// SECURITY TESTING
// =============================================================================

Deno.test("Security: enforces LLM lock", async () => {
  // Use a modified env where LLM_LOCK is not set to "1"
  // Note: assertLLMLock reads Deno.env directly, so we must mock Deno.env
  // But our core function uses `assertLLMLock` from a shared module.
  // The shared module likely reads `Deno.env.get("LLM_LOCK")`.
  // To test this properly without affecting the global process, we rely on the fact
  // that `assertLLMLock` checks Deno.env.

  const originalGet = Deno.env.get;
  Deno.env.get = (key: string) => {
      if (key === "LLM_LOCK") return "0";
      return originalGet(key);
  };

  const req = new Request("http://localhost/oil-gas-assistant", {
    method: "POST",
    body: JSON.stringify({ query: "Test query" }),
  });

  const res = await processOilGasRequest(req, mockSupabase as any, mockEnv);
  assertEquals(res.status, 503, "Should block access when LLM lock is disabled");

  // Restore
  Deno.env.get = originalGet;
});

Deno.test("Security: handles missing env vars", async () => {
    const brokenEnv = { ...mockEnv };
    delete brokenEnv.OPENAI_API_KEY;

    const req = new Request("http://localhost/oil-gas-assistant", {
      method: "POST",
      body: JSON.stringify({ query: "Test query" }),
    });

    // We expect 503 if the logic catches it as a security/config issue, or 500 otherwise.
    // In our implementation, if fetch fails due to missing key (undefined), it might throw.
    // The implementation uses `env.OPENAI_API_KEY`.

    const res = await processOilGasRequest(req, mockSupabase as any, brokenEnv as any);
    assert(res.status === 500 || res.status === 503, "Should fail safely");
});

// =============================================================================
// INTEGRATION / E2E FLOW
// =============================================================================

Deno.test("E2E: Full flow with context and logging", async () => {
    mockFetch({ choices: [{ message: { content: "Based on WITSML standards..." } }] });

    const req = new Request("http://localhost/oil-gas-assistant", {
        method: "POST",
        body: JSON.stringify({
            query: "Explain WITSML",
            user_id: "test-user",
            context: [{ role: "user", content: "Previous message" }]
        }),
    });

    const res = await processOilGasRequest(req, mockSupabase as any, mockEnv);
    assertEquals(res.status, 200);

    const data: OilGasResponse = await res.json();
    assert(data.response.includes("WITSML"), "Response should contain expected content");
    assert(data.citations.length > 0, "Citations should be provided");
    assertEquals(data.model, "gpt-4o-mini", "Should return used model");

    restoreFetch();
});
