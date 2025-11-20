import { describe, beforeEach, it, expect, vi } from 'vitest';

import { deduper, fetchInvoicesPaginated } from './api-client';

let currentResult: { data: any[]; error: any } = { data: [], error: null };

const queryBuilder: any = {
  select: vi.fn().mockImplementation(() => queryBuilder),
  order: vi.fn().mockImplementation(() => queryBuilder),
  limit: vi.fn().mockImplementation(() => queryBuilder),
  eq: vi.fn().mockImplementation(() => queryBuilder),
  or: vi.fn().mockImplementation(() => queryBuilder),
  then: (resolve: any, reject?: any) =>
    Promise.resolve(currentResult).then(resolve, reject),
};

const from = vi.fn(() => queryBuilder);

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from },
}));

describe('fetchInvoicesPaginated', () => {
  beforeEach(() => {
    currentResult = { data: [], error: null };
    queryBuilder.select.mockClear();
    queryBuilder.order.mockClear();
    queryBuilder.limit.mockClear();
    queryBuilder.eq.mockClear();
    queryBuilder.or.mockClear();
    from.mockClear();
    (deduper as any).pending?.clear?.();
  });

  it('applies user filter and returns stable keyset cursor', async () => {
    currentResult = {
      data: [
        { id: '3', created_at: '2024-01-03T00:00:00Z' },
        { id: '2', created_at: '2024-01-02T00:00:00Z' },
        { id: '1', created_at: '2024-01-01T00:00:00Z' },
      ],
      error: null,
    };

    const result = await fetchInvoicesPaginated({ limit: 2, userId: 'user-123' });

    expect(from).toHaveBeenCalledWith('invoices');
    expect(queryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(queryBuilder.order).toHaveBeenCalledTimes(2);
    expect(queryBuilder.limit).toHaveBeenCalledWith(3);
    expect(result.data).toHaveLength(2);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toEqual({ id: '2', created_at: '2024-01-02T00:00:00Z' });
  });

  it('applies keyset cursor when afterId and afterCreatedAt provided', async () => {
    currentResult = { data: [], error: null };

    await fetchInvoicesPaginated({ afterCreatedAt: '2024-01-02', afterId: 'abcd', userId: 'user-1' });

    expect(queryBuilder.or).toHaveBeenCalledWith(
      'created_at.lt.2024-01-02,and(created_at.eq.2024-01-02,id.lt.abcd)'
    );
  });
});
