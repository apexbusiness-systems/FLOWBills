import { supabase } from "@/integrations/supabase/client";

export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  checks: {
    database: boolean;
    auth: boolean;
    storage: boolean;
    api: boolean;
  };
  timestamp: Date;
  responseTime: number;
}

export class HealthChecker {
  private static instance: HealthChecker;

  static getInstance(): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker();
    }
    return HealthChecker.instance;
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    const checks = {
      database: false,
      auth: false,
      storage: false,
      api: false,
    };

    // Database health check - use existing invoices table for connectivity test
    try {
      const { data, error } = await supabase.from("invoices").select("count").limit(1);

      checks.database = !error;
    } catch {
      checks.database = false;
    }

    // Auth health check
    try {
      const { data, error } = await supabase.auth.getSession();
      checks.auth = !error;
    } catch {
      checks.auth = false;
    }

    // Storage health check
    try {
      const { data, error } = await supabase.storage.listBuckets();
      checks.storage = !error;
    } catch {
      checks.storage = false;
    }

    // API health check
    try {
      const response = await fetch("/api/health", { method: "HEAD" });
      checks.api = response.ok;
    } catch {
      checks.api = false; // API might not exist, that's ok
    }

    const healthyCount = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;

    let status: HealthCheckResult["status"] = "healthy";
    if (healthyCount === 0) {
      status = "unhealthy";
    } else if (healthyCount < totalChecks) {
      status = "degraded";
    }

    const responseTime = Date.now() - startTime;

    return {
      status,
      checks,
      timestamp: new Date(),
      responseTime,
    };
  }

  async monitorHealth(intervalMs: number = 30000): Promise<void> {
    const checkHealth = async () => {
      try {
        const result = await this.performHealthCheck();

        // Emit health check event
        window.dispatchEvent(
          new CustomEvent("health-check", {
            detail: result,
          })
        );

        if (result.status === "unhealthy") {
          console.warn("System health check failed:", result);
        }
      } catch (error) {
        console.error("Health check monitoring error:", error);
      }
    };

    // Initial check
    await checkHealth();

    // Set up interval monitoring
    setInterval(checkHealth, intervalMs);
  }

  // Utility method to check specific service health
  async checkDatabaseConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from("invoices").select("count").limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  async checkAuthService(): Promise<boolean> {
    try {
      const { error } = await supabase.auth.getSession();
      return !error;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const healthChecker = HealthChecker.getInstance();
