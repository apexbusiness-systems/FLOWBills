import { createClient } from "jsr:@supabase/supabase-js@2";

export type TenantShieldContext = {
  request: Request;
  userId: string;
};

export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return null;

  return token.trim() || null;
}

export async function getUserFromJwt(token: string) {
  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient.auth.getUser(token);

  if (error || !data.user) {
    throw new Error('Unauthorized');
  }

  return data.user;
}

export function createUserClient(token: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export function createServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

export function assertTenantAccess(tenantId: string, ctx: TenantShieldContext): void {
  if (!tenantId || tenantId !== ctx.userId) {
    throw new Error('Forbidden');
  }
}
