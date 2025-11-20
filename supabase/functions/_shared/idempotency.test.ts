import { describe, expect, it } from 'vitest';
import { withIdempotency } from './idempotency';

type IdempotencyRow = {
  tenant_id: string;
  scope: string;
  idempotency_key: string;
  request_hash: string;
  status: string;
  response_status?: number | null;
  response_body?: unknown;
  response_headers?: Record<string, string>;
  expires_at?: string;
  completed_at?: string;
};

function createMockSupabase(initialRows: IdempotencyRow[] = []) {
  const table = [...initialRows];

  return {
    table,
    from() {
      const filters: [keyof IdempotencyRow, any][] = [];

      return {
        select() {
          return this;
        },
        eq(column: keyof IdempotencyRow, value: any) {
          filters.push([column, value]);
          return this;
        },
        maybeSingle() {
          const match = table.find((row) =>
            filters.every(([column, value]) => row[column] === value)
          );
          return Promise.resolve({ data: match ?? null, error: null });
        },
        insert(rows: IdempotencyRow | IdempotencyRow[]) {
          const incoming = Array.isArray(rows) ? rows : [rows];
          incoming.forEach((row) => table.push({ ...row }));
          return Promise.resolve({ data: null, error: null });
        },
        update(values: Partial<IdempotencyRow>) {
          const updateFilters: [keyof IdempotencyRow, any][] = [];
          const applyUpdate = () => {
            const match = table.find((row) =>
              [...filters, ...updateFilters].every(([col, val]) => row[col] === val)
            );

            if (match) {
              Object.assign(match, values);
            }

            return { data: match ? [match] : [], error: null };
          };

          const builder: any = {
            eq(column: keyof IdempotencyRow, value: any) {
              updateFilters.push([column, value]);
              return builder;
            },
            then(onFulfilled: any, onRejected: any) {
              try {
                const result = applyUpdate();
                return Promise.resolve(result).then(onFulfilled, onRejected);
              } catch (error) {
                return Promise.reject(error).then(onFulfilled, onRejected);
              }
            },
          };

          return builder;
        },
      };
    },
  } as any;
}

describe('withIdempotency', () => {
  it('returns stored response on duplicate calls with matching body', async () => {
    const supabase = createMockSupabase();
    let handlerCalls = 0;

    const requestFactory = () =>
      new Request('http://localhost/webhook', {
        method: 'POST',
        headers: {
          'idempotency-key': 'dup-1',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ event: 'test', payload: 1 }),
      });

    const first = await withIdempotency(
      requestFactory(),
      async (body: any) => {
        handlerCalls += 1;
        return { status: 201, body: { received: body.payload } };
      },
      { scope: 'test-scope', tenantId: 'tenant-1', supabaseClient: supabase }
    );

    expect(handlerCalls).toBe(1);
    expect(first.status).toBe(201);
    expect(await first.json()).toEqual({ received: 1 });

    const second = await withIdempotency(
      requestFactory(),
      async () => {
        handlerCalls += 1;
        return { status: 201, body: { received: 2 } };
      },
      { scope: 'test-scope', tenantId: 'tenant-1', supabaseClient: supabase }
    );

    expect(handlerCalls).toBe(1);
    expect(second.status).toBe(201);
    expect(await second.json()).toEqual({ received: 1 });
  });

  it('rejects mismatched payloads for the same idempotency key', async () => {
    const supabase = createMockSupabase();
    const baseHeaders = {
      'idempotency-key': 'dup-2',
      'content-type': 'application/json',
    };

    await withIdempotency(
      new Request('http://localhost', {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify({ value: 1 }),
      }),
      async () => ({ status: 200, body: { ok: true } }),
      { scope: 'test-scope', tenantId: 'tenant-1', supabaseClient: supabase }
    );

    const conflict = await withIdempotency(
      new Request('http://localhost', {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify({ value: 2 }),
      }),
      async () => ({ status: 200, body: { ok: false } }),
      { scope: 'test-scope', tenantId: 'tenant-1', supabaseClient: supabase }
    );

    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toEqual({ error: 'Request body mismatch for idempotency key' });
  });
});
