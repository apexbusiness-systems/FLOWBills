import { describe, bench, expect } from 'vitest';
import { fetchUWIProductionDataLegacy, fetchUWIProductionDataOptimized } from '../useReports.utils';

// Mock Supabase client
function createMockSupabase(latencyMs: number = 0) {
  let queryCount = 0;

  const chainable = {
    select: () => chainable,
    eq: () => chainable,
    in: () => chainable,
    order: () => chainable,
    then: (resolve: any) => {
      queryCount++;
      setTimeout(() => {
        resolve({ data: [], error: null });
      }, latencyMs);
    }
  };

  return {
    from: () => chainable,
    getQueryCount: () => queryCount,
  } as any;
}

// Generate test dataset
function generateTestUWIs(count: number): any[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `uwi-${i}`,
    uwi: `100/${i}/W5`,
    well_name: `Test Well ${i}`,
    status: 'active',
    province: 'AB',
    operator: 'Test Operator',
    user_id: 'test-user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

describe('UWI Production Data Performance', () => {
  const testSizes = [10, 50, 100];

  testSizes.forEach(size => {
    bench(`Legacy N+1 approach - ${size} UWIs`, async () => {
      const supabase = createMockSupabase(1); // Minimal latency to ensure async behavior
      const uwis = generateTestUWIs(size);

      await fetchUWIProductionDataLegacy(uwis, 'test-user', supabase);

      // Verify query count (2 queries per UWI: extractions + tickets)
      // Note: Invoices query is skipped because mock returns empty extractions
      expect(supabase.getQueryCount()).toBe(size * 2);
    });

    bench(`Optimized bulk approach - ${size} UWIs`, async () => {
      const supabase = createMockSupabase(1);
      const uwis = generateTestUWIs(size);

      await fetchUWIProductionDataOptimized(uwis, 'test-user', supabase);

      // Verify query count (3 queries total)
      expect(supabase.getQueryCount()).toBe(3);
    });
  });
});
