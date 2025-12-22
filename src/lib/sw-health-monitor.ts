/**
 * Service Worker Health Monitor
 * Monitors service worker health and implements automatic recovery
 */

import { logger } from './logger';

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
  private recoveryStartTime: number | null = null;
  private readonly MAX_FAILURES = 3;
  private readonly CHECK_INTERVAL = 60000; // 1 minute
  private readonly RECOVERY_TIMEOUT_MS = 30000; // 30 seconds max recovery time

  /**
   * Register service worker with health monitoring
   * FIRST clears all existing registrations and caches for clean state
   */
  async register(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      logger.warn('Service Worker not supported');
      return;
    }

    try {
      // STEP 1: Clear all existing registrations to ensure clean state
      const existingRegs = await navigator.serviceWorker.getRegistrations();
      if (existingRegs.length > 0) {
        logger.debug(`Clearing ${existingRegs.length} existing service worker(s)...`);
        await Promise.all(existingRegs.map(reg => reg.unregister()));
      }

      // STEP 2: Clear all caches
      const cacheKeys = await caches.keys();
      if (cacheKeys.length > 0) {
        logger.debug(`Clearing ${cacheKeys.length} cache(s)...`);
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
      }

      // STEP 3: Now register fresh
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none', // Always fetch fresh SW
      });

      logger.info('Service Worker registered (clean state)');
      this.status.registered = true;
      this.status.failureCount = 0;
      this.status.error = undefined;
      this.recoveryStartTime = null; // Reset recovery timer on success

      // Check if SW is active
      if (registration.active) {
        this.status.active = true;
        logger.debug('Service Worker is active');
      }

      // Monitor for updates (but don't prompt aggressively)
      registration.addEventListener('updatefound', () => {
        logger.debug('Service Worker update found');
      });

      // Start health monitoring
      this.startHealthChecks();

    } catch (error) {
      logger.warn('SW registration skipped', error);
      // Don't retry aggressively - let the app work without SW
      this.status.registered = false;
      this.status.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  /**
   * Handle registration errors with automatic recovery
   */
  private async handleRegistrationError(error: unknown): Promise<void> {
    logger.error('Service Worker registration failed', error);
    this.status.registered = false;
    this.status.error = error instanceof Error ? error.message : 'Unknown error';
    this.status.failureCount++;

    // Check if recovery has been running too long
    if (this.recoveryStartTime && Date.now() - this.recoveryStartTime > this.RECOVERY_TIMEOUT_MS) {
      logger.error('Service Worker recovery timeout - forcing full page reload');
      await this.unregisterAll();
      // Force full page reload to break out of any recovery loop
      window.location.reload();
      return;
    }

    // Attempt recovery if under failure threshold
    if (this.status.failureCount < this.MAX_FAILURES) {
      logger.debug(`Attempting recovery (${this.status.failureCount}/${this.MAX_FAILURES})...`);
      if (!this.recoveryStartTime) {
        this.recoveryStartTime = Date.now();
      }
      await this.recover();
    } else {
      logger.error('Service Worker recovery failed after max attempts - forcing full page reload');
      await this.unregisterAll();
      // Force full page reload to break out of any recovery loop
      window.location.reload();
    }
  }

  /**
   * Attempt to recover from failed registration
   */
  async recover(): Promise<void> {
    // Check timeout before starting recovery
    if (this.recoveryStartTime && Date.now() - this.recoveryStartTime > this.RECOVERY_TIMEOUT_MS) {
      logger.error('Service Worker recovery timeout exceeded - forcing full page reload');
      await this.unregisterAll();
      window.location.reload();
      return;
    }

    // Set recovery start time if not already set
    if (!this.recoveryStartTime) {
      this.recoveryStartTime = Date.now();
    }

    try {
      // Unregister existing service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      
      logger.debug('Cleared old service workers');

      // Clear all caches
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map(key => caches.delete(key)));
      
      logger.debug('Cleared all caches');

      // Wait a bit before re-registering
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check timeout again before retrying registration
      if (this.recoveryStartTime && Date.now() - this.recoveryStartTime > this.RECOVERY_TIMEOUT_MS) {
        logger.error('Service Worker recovery timeout during cleanup - forcing full page reload');
        window.location.reload();
        return;
      }

      // Retry registration
      await this.register();
    } catch (error) {
      logger.error('Recovery failed', error);
      this.status.failureCount++;
      
      // Check timeout after error
      if (this.recoveryStartTime && Date.now() - this.recoveryStartTime > this.RECOVERY_TIMEOUT_MS) {
        logger.error('Service Worker recovery timeout after error - forcing full page reload');
        await this.unregisterAll();
        window.location.reload();
        return;
      }
    }
  }

  /**
   * Unregister all service workers (emergency fallback)
   */
  async unregisterAll(): Promise<void> {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      logger.info('All service workers unregistered');
      this.status.registered = false;
      this.status.active = false;
    } catch (error) {
      logger.error('Failed to unregister service workers', error);
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
        logger.warn('Service Worker not registered, attempting recovery...');
        await this.recover();
        return;
      }

      this.status.registered = true;
      this.status.active = !!registration.active;

      // Check if SW is stuck in installing/waiting
      if (registration.installing) {
        logger.debug('Service Worker installing...');
      } else if (registration.waiting) {
        logger.debug('Service Worker waiting...');
        // Prompt user to activate new SW
        if (confirm('Update available! Activate now?')) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }

    } catch (error) {
      logger.error('Health check failed', error);
      this.status.error = error instanceof Error ? error.message : 'Unknown error';
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
        logger.debug('Service Worker update check triggered');
      }
    } catch (error) {
      logger.error('Force update failed', error);
    }
  }
}

// Export singleton instance
export const swHealthMonitor = new ServiceWorkerHealthMonitor();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  interface SWHealthDebug {
    status: () => SWHealthStatus;
    recover: () => Promise<void>;
    unregister: () => Promise<void>;
    update: () => Promise<void>;
  }
  
  (window as Window & { swHealth?: SWHealthDebug }).swHealth = {
    status: () => swHealthMonitor.getStatus(),
    recover: () => swHealthMonitor.recover(),
    unregister: () => swHealthMonitor.unregisterAll(),
    update: () => swHealthMonitor.forceUpdate(),
  };
}
