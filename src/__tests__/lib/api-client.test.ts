import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queryClient, fetchInvoicesPaginated, idempotentMutation } from '@/lib/api-client';
import { deduper } from '@/lib/observability';

describe('API Client', () => {
  describe('queryClient', () => {
    it('should be configured with correct default options', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      
      expect(defaultOptions.queries).toBeDefined();
      expect(defaultOptions.queries?.staleTime).toBe(5 * 60 * 1000); // 5 minutes
      expect(defaultOptions.queries?.gcTime).toBe(10 * 60 * 1000); // 10 minutes
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
      expect(defaultOptions.queries?.refetchOnMount).toBe(false);
    });

    it('should have retry logic configured', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      const retryFn = defaultOptions.queries?.retry;
      
      expect(retryFn).toBeDefined();
      if (retryFn && typeof retryFn === 'function') {
        // Test that 4xx errors don't retry
        const httpError = { status: 404 };
        expect(retryFn(0, httpError)).toBe(false);
        
        // Test that 5xx errors retry (up to 2 times)
        const serverError = { status: 500 };
        expect(retryFn(0, serverError)).toBe(true);
        expect(retryFn(1, serverError)).toBe(true);
        expect(retryFn(2, serverError)).toBe(false);
      }
    });
  });

  describe('fetchInvoicesPaginated', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should be a function', () => {
      expect(typeof fetchInvoicesPaginated).toBe('function');
    });

    // Note: Full integration test would require mocking Supabase client
    // This is a unit test to verify the function exists and has correct signature
  });

  describe('idempotentMutation', () => {
    it('should be a function', () => {
      expect(typeof idempotentMutation).toBe('function');
    });

    it('should use deduper for idempotency', async () => {
      const mockFn = vi.fn().mockResolvedValue('result');
      const deduperSpy = vi.spyOn(deduper, 'once');

      await idempotentMutation('test-key', mockFn);

      expect(deduperSpy).toHaveBeenCalledWith(
        'mutation-test-key',
        expect.any(Function)
      );
    });
  });
});

