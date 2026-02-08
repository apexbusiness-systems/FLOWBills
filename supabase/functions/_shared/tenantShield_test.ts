import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { assertTenantAccess, getTokenFromRequest } from './tenantShield.ts';

Deno.test('getTokenFromRequest extracts bearer token', () => {
  const req = new Request('https://example.com', {
    headers: { Authorization: 'Bearer test-token' },
  });

  assertEquals(getTokenFromRequest(req), 'test-token');
});

Deno.test('getTokenFromRequest returns null for missing header', () => {
  const req = new Request('https://example.com');
  assertEquals(getTokenFromRequest(req), null);
});

Deno.test('assertTenantAccess deny-by-default', () => {
  assertThrows(
    () => assertTenantAccess('tenant-a', { request: new Request('https://example.com'), userId: 'tenant-b' }),
    Error,
    'Forbidden',
  );
});
