/**
 * Validates required configuration at runtime.
 * Now a no-op since Supabase config is hardcoded with public keys.
 */
export function validateSupabaseConfig(): void {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [];
    if (!SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
    if (!SUPABASE_PUBLISHABLE_KEY) missing.push('VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY');

    const error = new Error(
      `[FATAL] Missing required Supabase environment variables: ${missing.join(', ')}\n` +
      `Please ensure these are set at build time. Check your .env file and deployment configuration.`
    );
    error.name = 'ConfigError';
    throw error;
  }
}

/**
 * Performs a lightweight API availability check.
 * Returns true if Supabase is reachable, false otherwise.
 */
export async function checkApiAvailability(timeoutMs = 3000): Promise<boolean> {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

  if (!SUPABASE_URL) {
    // If no URL configured, consider it unavailable
    return false;
  }

  try {
    // Try to fetch a lightweight endpoint (Supabase health check or simple ping)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    // Consider 200-299 as success, but also accept 401/403 as the API is reachable
    // (just not authenticated, which is expected for a health check)
    return response.status >= 200 && response.status < 500;
  } catch (error) {
    // Network error, timeout, or other failure
    console.warn('[FlowBills] API availability check failed:', error);
    return false;
  }
}

