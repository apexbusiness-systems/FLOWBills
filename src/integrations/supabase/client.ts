// SECURITY NOTE: These are PUBLIC anon keys (safe to commit).
// Service role keys must NEVER be in client-side code.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Validate required environment variables at module load time
let supabaseConfigError: Error | null = null;
try {
  validateSupabaseConfig();
} catch (error) {
  supabaseConfigError = error instanceof Error ? error : new Error(String(error));
  console.error('[FlowBills] Supabase configuration error:', supabaseConfigError);
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = supabaseConfigError
  ? null // or create a dummy client if needed
  : createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
