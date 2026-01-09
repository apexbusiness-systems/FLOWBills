// P6: Frontend Performance Optimizations
import { QueryClient } from '@tanstack/react-query';
import { RequestDeduper } from './observability';

/**
 * P6: Optimized TanStack Query configuration
 * - Reduced refetch frequency
 * - Limited retries with exponential backoff
 * - Request de-duplication
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes (300000ms)
      gcTime: 10 * 60 * 1000, // 10 minutes (600000ms)
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors
        const httpError = error as { status?: number };
        if (httpError?.status && httpError.status >= 400 && httpError.status < 500) {
          return false;
        }
        // Max 2 retries
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => {
        // Exponential backoff with jitter
        const delay = Math.min(1000 * 2 ** attemptIndex, 4000);
        const jitter = Math.random() * 500;
        return delay + jitter;
      },
    },
    mutations: {
      retry: (failureCount, error: unknown) => {
        // Never retry mutations on 4xx
        const httpError = error as { status?: number };
        if (httpError?.status && httpError.status >= 400 && httpError.status < 500) {
          return false;
        }
        // Max 1 retry for mutations
        return failureCount < 1;
      },
    },
  },
});

/**
 * P6: Request de-duper singleton
 */
export const deduper = new RequestDeduper();

/**
 * P5: Keyset pagination helper for invoice list
 */
export interface KeysetPaginationParams {
  limit?: number;
  afterId?: string;
  afterCreatedAt?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: {
    id: string;
    created_at: string;
  };
  hasMore: boolean;
}

/**
 * Fetch invoices with keyset pagination (no offset scans)
 */
export async function fetchInvoicesPaginated(
  params: KeysetPaginationParams = {}
): Promise<PaginatedResponse<Record<string, unknown>>> {
  const { limit = 50, afterId, afterCreatedAt } = params;
  
  return deduper.once(`invoices-${afterId || 'first'}-${limit}`, async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    let query = supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1); // Fetch one extra to check hasMore
    
    // Apply keyset cursor if provided
    if (afterCreatedAt && afterId) {
      query = query.or(`created_at.lt.${afterCreatedAt},and(created_at.eq.${afterCreatedAt},id.lt.${afterId})`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    const items = data || [];
    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, -1) : items;
    const nextCursor = hasMore && resultItems.length > 0
      ? { id: resultItems[resultItems.length - 1].id, created_at: resultItems[resultItems.length - 1].created_at! }
      : undefined;
    
    return {
      data: resultItems as Record<string, unknown>[],
      nextCursor,
      hasMore,
    };
  });
}

/**
 * P4: Idempotent mutation wrapper for critical operations
 */
export async function idempotentMutation<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  return deduper.once(`mutation-${key}`, fn);
}