// P0 — Global System Configuration
// All system-wide constants and configuration following P0 directives

export const SYSTEM_CONFIG = {
  // Timezone
  TIMEZONE: "America/Edmonton",

  // Performance Budgets
  PERFORMANCE: {
    API_P95_LATENCY_MS: 500,
    INITIAL_JS_KB_GZIP: 170,
    FCP_MS: 1200,
    TTI_MS: 2500,
    LCP_MS: 2000,
    CLS: 0.1,
  },

  // Retry Policy
  RETRY: {
    MAX_ATTEMPTS: 2,
    BASE_DELAY_MS: 250,
    MAX_DELAY_MS: 1000,
    JITTER_FACTOR: 0.2,
  },

  // Rate Limiting
  RATE_LIMITS: {
    ANONYMOUS_PER_MIN: 10,
    AUTHENTICATED_PER_MIN: 100,
    BURST_MULTIPLIER: 2,
  },

  // Database
  DATABASE: {
    STATEMENT_TIMEOUT_MS: 3000,
    IDLE_IN_TRANSACTION_TIMEOUT_MS: 5000,
    MAX_CONNECTIONS: 20,
  },

  // Queue Limits
  QUEUE: {
    MAX_DEPTH: 10000,
  },

  // Idempotency
  IDEMPOTENCY: {
    KEY_TTL_HOURS: 24,
    LOCK_TIMEOUT_MS: 5000,
  },
} as const;

// Security Headers - Enterprise Production Grade
export const SECURITY_HEADERS = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'nonce-{NONCE}' https://www.googletagmanager.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "img-src 'self' data: https: blob:",
    "style-src 'self' 'nonce-{NONCE}'",
    "font-src 'self' data:",
    "frame-ancestors 'none'",
  ].join("; "),
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
} as const;

// Observability Labels
export interface ObservabilityLabels {
  tenant_id?: string;
  route: string;
  request_id: string;
  user_id?: string;
}

// Retry configuration helper
export function getRetryDelay(attempt: number): number {
  const baseDelay = Math.pow(2, attempt) * SYSTEM_CONFIG.RETRY.BASE_DELAY_MS;
  const jitter = Math.random() * (baseDelay * SYSTEM_CONFIG.RETRY.JITTER_FACTOR);
  return Math.min(baseDelay + jitter, SYSTEM_CONFIG.RETRY.MAX_DELAY_MS);
}

// Check if error should be retried
export function shouldRetry(error: any): boolean {
  // Don't retry client errors (4xx except 429)
  if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
    return false;
  }
  // Retry server errors (5xx) and network errors
  return true;
}
