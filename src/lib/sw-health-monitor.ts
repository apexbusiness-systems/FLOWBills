/**
 * Service Worker Health Monitor
 * Monitors service worker health and implements automatic recovery
 */

interface SWHealthStatus {
  registered: boolean;
  active: boolean;
  lastCheck: Date;
  failureCount: number;
  error?: string;
}

class ServiceWorkerHealthMonitor {
  private status: SWHealthStatus = {
    registered: false,
    active: false,
    lastCheck: new Date(),
    failureCount: 0,
  };

  private checkInterval: number | null = null;
  private readonly MAX_FAILURES = 3;
  private readonly CHECK_INTERVAL = 60000; // 1 minute

  /**
   * Register service worker with health monitoring
   * FIRST clears all existing registrations and caches for clean state
   */
  async register(): Promise<void> {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Worker not supported");
      return;
    }

    try {
      // STEP 1: Clear all existing registrations to ensure clean state
      const existingRegs = await navigator.serviceWorker.getRegistrations();
      if (existingRegs.length > 0) {
        console.log(`Clearing ${existingRegs.length} existing service worker(s)...`);
        await Promise.all(existingRegs.map((reg) => reg.unregister()));
      }

      // STEP 2: Clear all caches
      const cacheKeys = await caches.keys();
      if (cacheKeys.length > 0) {
        console.log(`Clearing ${cacheKeys.length} cache(s)...`);
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }

      // STEP 3: Now register fresh
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none", // Always fetch fresh SW
      });

      console.log("✓ Service Worker registered (clean state)");
      this.status.registered = true;
      this.status.failureCount = 0;
      this.status.error = undefined;

      // Check if SW is active
      if (registration.active) {
        this.status.active = true;
        console.log("✓ Service Worker is active");
      }

      // Monitor for updates (but don't prompt aggressively)
      registration.addEventListener("updatefound", () => {
        console.log("→ Service Worker update found");
      });

      // Start health monitoring
      this.startHealthChecks();
    } catch (error) {
      console.warn("SW registration skipped:", error);
      // Don't retry aggressively - let the app work without SW
      this.status.registered = false;
      this.status.error = error instanceof Error ? error.message : "Unknown error";
    }
  }

  /**
   * Handle registration errors with automatic recovery
   */
  private async handleRegistrationError(error: any): Promise<void> {
    console.error("✗ Service Worker registration failed:", error);
    this.status.registered = false;
    this.status.error = error.message || "Unknown error";
    this.status.failureCount++;

    // Attempt recovery if under failure threshold
    if (this.status.failureCount < this.MAX_FAILURES) {
      console.log(`→ Attempting recovery (${this.status.failureCount}/${this.MAX_FAILURES})...`);
      await this.recover();
    } else {
      console.error("✗ Service Worker recovery failed after max attempts");
      await this.unregisterAll();
    }
  }

  /**
   * Attempt to recover from failed registration
   */
  async recover(): Promise<void> {
    try {
      // Unregister existing service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));

      console.log("✓ Cleared old service workers");

      // Clear all caches
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));

      console.log("✓ Cleared all caches");

      // Wait a bit before re-registering
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Retry registration
      await this.register();
    } catch (error) {
      console.error("✗ Recovery failed:", error);
      this.status.failureCount++;
    }
  }

  /**
   * Unregister all service workers (emergency fallback)
   */
  async unregisterAll(): Promise<void> {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
      console.log("✓ All service workers unregistered");
      this.status.registered = false;
      this.status.active = false;
    } catch (error) {
      console.error("✗ Failed to unregister service workers:", error);
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    if (this.checkInterval) return;

    this.checkInterval = window.setInterval(() => {
      this.checkHealth();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Stop health checks
   */
  stopHealthChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check service worker health
   */
  private async checkHealth(): Promise<void> {
    this.status.lastCheck = new Date();

    try {
      const registration = await navigator.serviceWorker.getRegistration();

      if (!registration) {
        console.warn("⚠ Service Worker not registered, attempting recovery...");
        await this.recover();
        return;
      }

      this.status.registered = true;
      this.status.active = !!registration.active;

      // Check if SW is stuck in installing/waiting
      if (registration.installing) {
        console.log("→ Service Worker installing...");
      } else if (registration.waiting) {
        console.log("→ Service Worker waiting...");
        // Prompt user to activate new SW
        if (confirm("Update available! Activate now?")) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      }
    } catch (error) {
      console.error("✗ Health check failed:", error);
      this.status.error = error instanceof Error ? error.message : "Unknown error";
    }
  }

  /**
   * Get current health status
   */
  getStatus(): SWHealthStatus {
    return { ...this.status };
  }

  /**
   * Force update service worker
   */
  async forceUpdate(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        console.log("✓ Service Worker update check triggered");
      }
    } catch (error) {
      console.error("✗ Force update failed:", error);
    }
  }
}

// Export singleton instance
export const swHealthMonitor = new ServiceWorkerHealthMonitor();

// Expose to window for debugging
if (typeof window !== "undefined") {
  (window as any).swHealth = {
    status: () => swHealthMonitor.getStatus(),
    recover: () => swHealthMonitor.recover(),
    unregister: () => swHealthMonitor.unregisterAll(),
    update: () => swHealthMonitor.forceUpdate(),
  };
}
