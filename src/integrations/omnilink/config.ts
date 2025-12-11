// ============================================================
// APEX OMNiLiNK Port Configuration
// CONFIDENTIAL - Internal Use Only
// ============================================================

export interface OmniLinkConfig {
  enabled: boolean;
  baseUrl: string | null;
  tenantId: string | null;
  apiVersion: string;
  timeout: number;
  retryAttempts: number;
}

export type OmniLinkStatus = 'disabled' | 'enabled' | 'misconfigured' | 'error';

/**
 * Reads OMNiLiNK configuration from environment
 * Returns disabled status when not configured (default state)
 */
export const getOmniLinkConfig = (): OmniLinkConfig => {
  // Read from import.meta.env for Vite compatibility
  const enabled = import.meta.env.VITE_OMNILINK_ENABLED === 'true';
  const baseUrl = import.meta.env.VITE_OMNILINK_BASE_URL || null;
  const tenantId = import.meta.env.VITE_OMNILINK_TENANT_ID || null;

  return {
    enabled,
    baseUrl,
    tenantId,
    apiVersion: 'v1',
    timeout: 30000,
    retryAttempts: 3,
  };
};

/**
 * Get current OMNiLiNK port status
 */
export const getOmniLinkStatus = (): OmniLinkStatus => {
  const config = getOmniLinkConfig();

  if (!config.enabled) {
    return 'disabled';
  }

  if (!config.baseUrl || !config.tenantId) {
    return 'misconfigured';
  }

  return 'enabled';
};

/**
 * Check if OMNiLiNK is ready for use
 */
export const isOmniLinkReady = (): boolean => {
  return getOmniLinkStatus() === 'enabled';
};
