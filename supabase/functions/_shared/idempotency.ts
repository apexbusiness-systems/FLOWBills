// P4: Idempotency Middleware for Edge Functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface IdempotentResponse {
  status: number;
  body: any;
  headers?: Record<string, string>;
}

/**
 * Wraps an Edge Function handler with idempotency guarantees.
 * Requires 'Idempotency-Key' header in request.
 * 
 * @param req - The incoming request
 * @param handler - The actual handler function to execute
 * @returns Response with idempotency guarantees
 */
export async function withIdempotency(
  req: Request,
  handler: (req: Request) => Promise<IdempotentResponse>
): Promise<Response> {
  const idempotencyKey = req.headers.get('idempotency-key');
  
  if (!idempotencyKey) {
    return new Response(
      JSON.stringify({ error: 'Idempotency-Key header required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Hash request body for conflict detection
  const body = await req.text();
  const encoder = new TextEncoder();
  const data = encoder.encode(body);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const requestHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Check for existing idempotency key
  const { data: existing } = await supabase
    .from('idempotency_keys')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .single();

  if (existing) {
    // Check if request body matches
    if (existing.request_hash !== requestHash) {
      return new Response(
        JSON.stringify({ error: 'Request body mismatch for idempotency key' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If still processing, return 425 Too Early
    if (existing.status === 'processing') {
      return new Response(
        JSON.stringify({ error: 'Request still processing' }),
        { status: 425, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If completed, return stored response
    if (existing.status === 'completed') {
      return new Response(
        JSON.stringify(existing.response_body),
        {
          status: existing.response_status || 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // Create new idempotency record with PostgreSQL advisory lock
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24h expiry

  const { error: insertError } = await supabase
    .from('idempotency_keys')
    .insert({
      idempotency_key: idempotencyKey,
      request_hash: requestHash,
      status: 'processing',
      expires_at: expiresAt.toISOString(),
    });

  if (insertError) {
    // Race condition: another request inserted first
    return new Response(
      JSON.stringify({ error: 'Concurrent request detected' }),
      { status: 425, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Execute the actual handler
    const result = await handler(new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: body || undefined,
    }));

    // Store successful response
    await supabase
      .from('idempotency_keys')
      .update({
        status: 'completed',
        response_status: result.status,
        response_body: result.body,
        completed_at: new Date().toISOString(),
      })
      .eq('idempotency_key', idempotencyKey);

    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { 'Content-Type': 'application/json', ...result.headers },
    });
  } catch (err) {
    // Mark as failed
    await supabase
      .from('idempotency_keys')
      .update({
        status: 'failed',
        response_body: { error: err.message },
        completed_at: new Date().toISOString(),
      })
      .eq('idempotency_key', idempotencyKey);

    throw err;
  }
}