import { performanceMonitor } from '@/lib/performance-monitor';
import { setupTestEnvironment } from '@/lib/test-utils';
import { vi, describe, it, beforeEach, expect } from 'vitest';

setupTestEnvironment();

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => 1000),
  getEntriesByType: vi.fn(() => [{
    loadEventEnd: 2000,
    loadEventStart: 1000,
    responseStart: 500,
    requestStart: 100,
  }]),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000,
  },
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
});

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    performanceMonitor.clearMetrics();
  });

  it('records performance metrics', () => {
    performanceMonitor.recordMetric('LCP', 2000);
    
    const summary = performanceMonitor.getPerformanceSummary();
    expect(summary.metrics).toHaveLength(1);
  });

  it('records component performance', () => {
    performanceMonitor.recordComponentMetric('TestComponent', 15, true);
    
    const summary = performanceMonitor.getPerformanceSummary();
    expect(summary.totalComponents).toBe(1);
  });

  it('warns on slow components', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    performanceMonitor.recordComponentMetric('SlowComponent', 20);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Slow component detected: SlowComponent')
    );
    
    consoleSpy.mockRestore();
  });

  it('records API metrics', () => {
    performanceMonitor.recordAPIMetric({
      endpoint: '/api/test',
      method: 'GET',
      duration: 500,
      status: 200,
      timestamp: Date.now(),
    });
    
    const summary = performanceMonitor.getPerformanceSummary();
    expect(summary.totalAPIsCalls).toBe(1);
  });

  it('gets current performance metrics', () => {
    const metrics = performanceMonitor.getCurrentMetrics();
    
    expect(metrics).toHaveProperty('pageLoadTime');
    expect(metrics).toHaveProperty('timeToFirstByte');
    expect(metrics).toHaveProperty('memoryUsage');
  });

  it('exports performance data', () => {
    performanceMonitor.recordMetric('LCP', 1500);
    
    const exportedData = performanceMonitor.exportPerformanceData();
    
    expect(exportedData).toHaveProperty('timestamp');
    expect(exportedData).toHaveProperty('metrics');
    expect(exportedData).toHaveProperty('summary');
  });

  it('clears metrics', () => {
    performanceMonitor.recordMetric('LCP', 1500);
    performanceMonitor.recordComponentMetric('TestComponent', 10);
    
    performanceMonitor.clearMetrics();
    
    const summary = performanceMonitor.getPerformanceSummary();
    expect(summary.metrics).toHaveLength(0);
    expect(summary.totalComponents).toBe(0);
  });
});