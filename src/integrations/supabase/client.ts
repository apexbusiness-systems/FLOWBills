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
  throw configError;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});