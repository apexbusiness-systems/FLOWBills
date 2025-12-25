/**
 * Validates required environment variables at runtime.
 * Throws a descriptive error if any are missing.
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

