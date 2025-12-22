import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deduper } from '@/lib/api-client';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have a deduper instance', () => {
    expect(deduper).toBeDefined();
    expect(deduper.once).toBeDefined();
    expect(typeof deduper.once).toBe('function');
  });

  it('should deduplicate concurrent requests', async () => {
    const mockFn = vi.fn().mockResolvedValue('result');
    
    const promise1 = deduper.once('test-key', mockFn);
    const promise2 = deduper.once('test-key', mockFn);
    const promise3 = deduper.once('test-key', mockFn);

    const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

    // All should return the same result
    expect(result1).toBe('result');
    expect(result2).toBe('result');
    expect(result3).toBe('result');

    // Function should only be called once
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should allow different keys to execute independently', async () => {
    const mockFn1 = vi.fn().mockResolvedValue('result1');
    const mockFn2 = vi.fn().mockResolvedValue('result2');

    const promise1 = deduper.once('key1', mockFn1);
    const promise2 = deduper.once('key2', mockFn2);

    const [result1, result2] = await Promise.all([promise1, promise2]);

    expect(result1).toBe('result1');
    expect(result2).toBe('result2');
    expect(mockFn1).toHaveBeenCalledTimes(1);
    expect(mockFn2).toHaveBeenCalledTimes(1);
  });
});
