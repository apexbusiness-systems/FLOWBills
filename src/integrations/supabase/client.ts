// SECURITY NOTE: These are PUBLIC anon keys (safe to commit).
// Service role keys must NEVER be in client-side code.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { validateSupabaseConfig } from '@/lib/config-validator';

// Validate required environment variables at module load time
try {
  validateSupabaseConfig();
} catch (error) {
  // Re-throw with ConfigError name for ErrorBoundary detection
  const configError = error instanceof Error ? error : new Error(String(error));
  configError.name = 'ConfigError';

  // In test environment, we don't want to crash if env vars are missing
  if (import.meta.env.MODE !== 'test') {
    throw configError;
  }
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://example.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'test-anon-key';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
