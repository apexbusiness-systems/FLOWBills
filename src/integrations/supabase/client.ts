// SECURITY NOTE: These are PUBLIC anon keys (safe to commit).
// Service role keys must NEVER be in client-side code.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = "https://ullqluvzkgnwwqijhvjr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbHFsdXZ6a2dud3dxaWpodmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MTY2OTEsImV4cCI6MjA3NDE5MjY5MX0.UjijCIx4OrtbSgmyDqdf455nUPD9AS0OIgOPopzaJGI";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
