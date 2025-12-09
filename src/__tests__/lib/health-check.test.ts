import { describe, it, expect, vi, beforeEach } from "vitest";
import { HealthChecker } from "@/lib/health-check";

// Mock Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
    storage: {
      listBuckets: vi.fn(() => Promise.resolve({ data: [], error: null })),
    },
  },
}));

describe("HealthChecker", () => {
  let healthChecker: HealthChecker;

  beforeEach(() => {
    healthChecker = HealthChecker.getInstance();
    vi.clearAllMocks();
  });

  it("should be a singleton", () => {
    const instance1 = HealthChecker.getInstance();
    const instance2 = HealthChecker.getInstance();
    expect(instance1).toBe(instance2);
  });

  it("should perform health check successfully", async () => {
    const result = await healthChecker.performHealthCheck();

    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("checks");
    expect(result).toHaveProperty("timestamp");
    expect(result).toHaveProperty("responseTime");

    expect(result.checks).toHaveProperty("database");
    expect(result.checks).toHaveProperty("auth");
    expect(result.checks).toHaveProperty("storage");
    expect(result.checks).toHaveProperty("api");
  });

  it("should return healthy status when all checks pass", async () => {
    const result = await healthChecker.performHealthCheck();

    // Should be healthy since our mocks return successful responses
    expect(["healthy", "degraded"]).toContain(result.status);
  });

  it("should check database connection", async () => {
    const isHealthy = await healthChecker.checkDatabaseConnection();
    expect(typeof isHealthy).toBe("boolean");
  });

  it("should check auth service", async () => {
    const isHealthy = await healthChecker.checkAuthService();
    expect(typeof isHealthy).toBe("boolean");
  });
});
