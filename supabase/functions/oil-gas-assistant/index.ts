import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { processOilGasRequest } from "./core.ts";

export const handler = async (req: Request): Promise<Response> => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  return await processOilGasRequest(req, supabase, Deno.env.toObject());
};

if (import.meta.main) {
  Deno.serve(handler);
}
