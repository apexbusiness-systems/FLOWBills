// ============================================================
// APEX OMNiLiNK Adapter
// CONFIDENTIAL - Internal Use Only
// ============================================================

import { getOmniLinkConfig, getOmniLinkStatus, isOmniLinkReady, type OmniLinkStatus } from './config';
import type { OmniLinkEvent, OmniLinkResponse, OmniLinkHealthStatus } from './types';

/**
 * OMNiLiNK Adapter - Handles communication with APEX OMNiLiNK Hub
 * 
 * This adapter is DORMANT by default and only activates when:
 * 1. VITE_OMNILINK_ENABLED=true
 * 2. VITE_OMNILINK_BASE_URL is configured
 * 3. VITE_OMNILINK_TENANT_ID is configured
 */
class OmniLinkAdapter {
  private eventQueue: OmniLinkEvent[] = [];
  private isProcessing = false;

  /**
   * Check if the OMNiLiNK port is enabled
   */
  isEnabled(): boolean {
    return isOmniLinkReady();
  }

  /**
   * Get detailed status of the OMNiLiNK configuration
   */
  getStatus(): OmniLinkStatus {
    return getOmniLinkStatus();
  }

  /**
   * Get health status for monitoring
   */
  async getHealthStatus(): Promise<OmniLinkHealthStatus> {
    const config = getOmniLinkConfig();
    const status = getOmniLinkStatus();

    const baseStatus: OmniLinkHealthStatus = {
      status: status === 'enabled' ? 'ok' : status === 'disabled' ? 'disabled' : 'error',
      details: {
        enabled: config.enabled,
        baseUrlConfigured: !!config.baseUrl,
        tenantConfigured: !!config.tenantId,
      },
    };

    // If enabled, perform a health check ping
    if (status === 'enabled' && config.baseUrl) {
      try {
        const startTime = performance.now();
        const response = await fetch(`${config.baseUrl}/health`, {
          method: 'GET',
          headers: {
            'X-Tenant-ID': config.tenantId || '',
            'X-API-Version': config.apiVersion,
          },
          signal: AbortSignal.timeout(5000),
        });

        const latencyMs = performance.now() - startTime;
        baseStatus.details.latencyMs = Math.round(latencyMs);
        baseStatus.details.lastHeartbeat = new Date().toISOString();

        if (!response.ok) {
          baseStatus.status = 'degraded';
        }
      } catch {
        baseStatus.status = 'error';
      }
    }

    return baseStatus;
  }

  /**
   * Send an event to the OMNiLiNK Hub
   * No-op when disabled - safe to call from anywhere
   */
  async sendEvent(event: OmniLinkEvent): Promise<OmniLinkResponse> {
    if (!this.isEnabled()) {
      // Silent no-op when disabled
      return {
        success: true,
        timestamp: new Date().toISOString(),
        data: { queued: false, reason: 'omnilink_disabled' },
      };
    }

    const config = getOmniLinkConfig();

    try {
      const response = await fetch(`${config.baseUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': config.tenantId || '',
          'X-API-Version': config.apiVersion,
        },
        body: JSON.stringify({
          ...event,
          tenantId: config.tenantId,
        }),
        signal: AbortSignal.timeout(config.timeout),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: errorData.message || response.statusText,
          },
          timestamp: new Date().toISOString(),
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Queue for retry on network errors
      this.eventQueue.push(event);
      
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Queue an event for batch processing
   * Useful for high-volume scenarios
   */
  queueEvent(event: OmniLinkEvent): void {
    if (!this.isEnabled()) return;
    this.eventQueue.push(event);
  }

  /**
   * Process queued events
   */
  async flushQueue(): Promise<OmniLinkResponse[]> {
    if (!this.isEnabled() || this.isProcessing || this.eventQueue.length === 0) {
      return [];
    }

    this.isProcessing = true;
    const results: OmniLinkResponse[] = [];
    const events = [...this.eventQueue];
    this.eventQueue = [];

    for (const event of events) {
      const result = await this.sendEvent(event);
      results.push(result);
    }

    this.isProcessing = false;
    return results;
  }

  /**
   * Manual sync trigger - pulls updates from hub
   */
  async syncOnce(): Promise<OmniLinkResponse<OmniLinkEvent[]>> {
    if (!this.isEnabled()) {
      return {
        success: true,
        timestamp: new Date().toISOString(),
        data: [],
      };
    }

    const config = getOmniLinkConfig();

    try {
      const response = await fetch(`${config.baseUrl}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': config.tenantId || '',
          'X-API-Version': config.apiVersion,
        },
        body: JSON.stringify({ syncType: 'incremental' }),
        signal: AbortSignal.timeout(config.timeout),
      });

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: response.statusText,
          },
          timestamp: new Date().toISOString(),
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.events || [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SYNC_ERROR',
          message: error instanceof Error ? error.message : 'Sync failed',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Pull pending updates from the hub
   */
  async pullUpdates(): Promise<OmniLinkEvent[]> {
    if (!this.isEnabled()) {
      return [];
    }

    const config = getOmniLinkConfig();

    try {
      const response = await fetch(`${config.baseUrl}/events/pending`, {
        method: 'GET',
        headers: {
          'X-Tenant-ID': config.tenantId || '',
          'X-API-Version': config.apiVersion,
        },
        signal: AbortSignal.timeout(config.timeout),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.events || [];
    } catch {
      return [];
    }
  }

  /**
   * Get queue size for monitoring
   */
  getQueueSize(): number {
    return this.eventQueue.length;
  }
}

// Singleton instance
export const omniLinkAdapter = new OmniLinkAdapter();
export { OmniLinkAdapter };
