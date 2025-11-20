// P4: Idempotency Middleware for Edge Functions
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.58.0";

export interface IdempotentResponse {
  status: number;
  body: any;
  headers?: Record<string, string>;
}

export interface IdempotencyOptions {
  scope: string;
  tenantId?: string;
  supabaseClient?: SupabaseClient;
  parseJson?: boolean;
}

const SYSTEM_TENANT_ID = "00000000-0000-0000-0000-000000000000";

const envAccessor =
  (globalThis as { Deno?: { env: { get(key: string): string | undefined } } }).Deno?.env;

const getEnv = (key: string): string | undefined => {
  if (envAccessor?.get) {
    return envAccessor.get(key);
  }

  if (typeof process !== "undefined") {
    return process.env?.[key];
  }

  return undefined;
};

async function hashRequestBody(body: string): Promise<string> {
  const data = new TextEncoder().encode(body);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Wraps an Edge Function handler with idempotency guarantees.
 * Requires 'Idempotency-Key' header in request.
 *
 * @param req - The incoming request
 * @param handler - The actual handler function to execute
 * @returns Response with idempotency guarantees
 */
export async function withIdempotency<T = unknown>(
  req: Request,
  handler: (body: T) => Promise<IdempotentResponse>,
  options: IdempotencyOptions
): Promise<Response> {
  const idempotencyKey = req.headers.get("idempotency-key");

  if (!idempotencyKey) {
    return new Response(
      JSON.stringify({ error: "Idempotency-Key header required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase =
    options.supabaseClient ??
    createClient(
      getEnv("SUPABASE_URL") ?? "",
      getEnv("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

  const rawBody = await req.text();
  const requestHash = await hashRequestBody(rawBody);
  const scope = options.scope || "default";
  const tenantId =
    options.tenantId ?? req.headers.get("x-tenant-id") ?? SYSTEM_TENANT_ID;

  const { data: existing } = await supabase
    .from("idempotency_keys")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("scope", scope)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing) {
    if (existing.request_hash !== requestHash) {
      return new Response(
        JSON.stringify({ error: "Request body mismatch for idempotency key" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    if (existing.status === "processing") {
      return new Response(
        JSON.stringify({ error: "Request still processing" }),
        { status: 425, headers: { "Content-Type": "application/json" } }
      );
    }

    if (existing.status === "completed") {
      return new Response(JSON.stringify(existing.response_body), {
        status: existing.response_status || 200,
        headers: {
          "Content-Type": "application/json",
          ...(existing.response_headers ?? {}),
        },
      });
    }
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const { error: insertError } = await supabase.from("idempotency_keys").insert({
    tenant_id: tenantId,
    scope,
    idempotency_key: idempotencyKey,
    request_hash: requestHash,
    status: "processing",
    expires_at: expiresAt.toISOString(),
  });

  if (insertError) {
    return new Response(
      JSON.stringify({ error: "Concurrent request detected" }),
      { status: 425, headers: { "Content-Type": "application/json" } }
    );
  }

  const parsedBody: T = (() => {
    if (options.parseJson === false) {
      return rawBody as unknown as T;
    }

    if (!rawBody) {
      return undefined as unknown as T;
    }

    try {
      return JSON.parse(rawBody) as T;
    } catch (_err) {
      throw new Error("Invalid JSON payload for idempotent handler");
    }
  })();

  try {
    const result = await handler(parsedBody);

    await supabase
      .from("idempotency_keys")
      .update({
        status: "completed",
        response_status: result.status,
        response_body: result.body,
        response_headers: result.headers ?? {},
        completed_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenantId)
      .eq("scope", scope)
      .eq("idempotency_key", idempotencyKey);

    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { "Content-Type": "application/json", ...result.headers },
    });
  } catch (err: any) {
    await supabase
      .from("idempotency_keys")
      .update({
        status: "failed",
        response_body: { error: err?.message ?? "Unknown error" },
        completed_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenantId)
      .eq("scope", scope)
      .eq("idempotency_key", idempotencyKey);

    throw err;
  }
}
