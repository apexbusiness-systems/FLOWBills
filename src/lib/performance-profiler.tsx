/**
 * Performance Profiler - DevOps Mastery Implementation
 * Provides comprehensive performance analysis and bottleneck identification
 */

import React from 'react';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface BottleneckAnalysis {
  component: string;
  complexity: string;
  renderTime: number;
  reRenderCount: number;
  suggestions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class PerformanceProfiler {
  private metrics: PerformanceMetric[] = [];
  private renderCounts: Map<string, number> = new Map();
  private renderTimes: Map<string, number[]> = new Map();
  private bottlenecks: BottleneckAnalysis[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn(`⚠️ Long task detected: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
              this.recordMetric({
                name: `long-task-${entry.name}`,
                duration: entry.duration,
                timestamp: Date.now(),
                metadata: { type: 'long-task', entry },
              });
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask', 'measure'] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        console.log('Long task observer not supported');
      }
    }
  }

  profile<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      
      this.recordMetric({ name, duration, timestamp: Date.now(), metadata });
      
      if (duration > 16.67) {
        console.warn(`⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric({ 
        name, 
        duration, 
        timestamp: Date.now(), 
        metadata: { ...metadata, error: true } 
      });
      throw error;
    }
  }

  async profileAsync<T>(
    name: string, 
    fn: () => Promise<T>, 
    metadata?: Record<string, any>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.recordMetric({ name, duration, timestamp: Date.now(), metadata });
      
      if (duration > 100) {
        console.warn(`⚠️ Slow async operation: ${name} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric({ 
        name, 
        duration, 
        timestamp: Date.now(), 
        metadata: { ...metadata, error: true } 
      });
      throw error;
    }
  }

  recordRender(componentName: string, duration: number) {
    const currentCount = this.renderCounts.get(componentName) || 0;
    this.renderCounts.set(componentName, currentCount + 1);

    const times = this.renderTimes.get(componentName) || [];
    times.push(duration);
    this.renderTimes.set(componentName, times);

    this.recordMetric({
      name: `render-${componentName}`,
      duration,
      timestamp: Date.now(),
      metadata: { renderCount: currentCount + 1 },
    });

    if (currentCount > 10) {
      console.warn(`⚠️ ${componentName} has rendered ${currentCount + 1} times`);
    }

    if (duration > 16.67) {
      console.warn(`⚠️ ${componentName} render took ${duration.toFixed(2)}ms (> 1 frame)`);
    }
  }

  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  analyzeBottlenecks(): BottleneckAnalysis[] {
    this.bottlenecks = [];

    this.renderTimes.forEach((times, component) => {
      const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
      const renderCount = this.renderCounts.get(component) || 0;

      const suggestions: string[] = [];
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

      if (avgTime > 16.67) {
        suggestions.push('Apply React.memo() to prevent unnecessary re-renders');
        suggestions.push('Use useMemo() for expensive calculations');
        severity = avgTime > 50 ? 'high' : 'medium';
      }

      if (renderCount > 20) {
        suggestions.push('Investigate why component re-renders frequently');
        suggestions.push('Consider using useCallback() for event handlers');
        severity = renderCount > 50 ? 'critical' : 'high';
      }

      if (suggestions.length > 0) {
        this.bottlenecks.push({
          component,
          complexity: this.estimateComplexity(avgTime, renderCount),
          renderTime: avgTime,
          reRenderCount: renderCount,
          suggestions,
          severity,
        });
      }
    });

    return this.bottlenecks.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  private estimateComplexity(avgTime: number, renderCount: number): string {
    if (avgTime > 100 || renderCount > 50) return 'O(n²) or worse';
    if (avgTime > 50 || renderCount > 20) return 'O(n log n)';
    if (avgTime > 16.67) return 'O(n)';
    return 'O(1) or O(log n)';
  }

  getReport() {
    const bottlenecks = this.analyzeBottlenecks();
    
    return {
      summary: {
        totalMetrics: this.metrics.length,
        totalComponents: this.renderCounts.size,
        criticalBottlenecks: bottlenecks.filter(b => b.severity === 'critical').length,
        highBottlenecks: bottlenecks.filter(b => b.severity === 'high').length,
      },
      bottlenecks,
      topSlowComponents: Array.from(this.renderTimes.entries())
        .map(([component, times]) => ({
          component,
          avgTime: times.reduce((sum, t) => sum + t, 0) / times.length,
          maxTime: Math.max(...times),
          renderCount: this.renderCounts.get(component) || 0,
        }))
        .sort((a, b) => b.avgTime - a.avgTime)
        .slice(0, 10),
      recentMetrics: this.metrics.slice(-50),
    };
  }

  exportMetrics() {
    return {
      metrics: this.metrics,
      renderStats: Array.from(this.renderTimes.entries()).map(([component, times]) => ({
        component,
        times,
        renderCount: this.renderCounts.get(component),
      })),
      bottlenecks: this.bottlenecks,
      timestamp: new Date().toISOString(),
    };
  }

  clear() {
    this.metrics = [];
    this.renderCounts.clear();
    this.renderTimes.clear();
    this.bottlenecks = [];
  }

  dispose() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.clear();
  }
}

export const performanceProfiler = new PerformanceProfiler();

export function usePerformanceProfiler(componentName: string) {
  const startTimeRef = { current: performance.now() };

  if (typeof window !== 'undefined') {
    const duration = performance.now() - startTimeRef.current;
    performanceProfiler.recordRender(componentName, duration);
    startTimeRef.current = performance.now();
  }

  return {
    profile<T>(name: string, fn: () => T): T {
      return performanceProfiler.profile(`${componentName}.${name}`, fn);
    },
    profileAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
      return performanceProfiler.profileAsync(`${componentName}.${name}`, fn);
    },
  };
}

export function withPerformanceProfiler<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const name = componentName || Component.displayName || Component.name || 'Unknown';
  
  return function ProfiledComponent(props: P) {
    usePerformanceProfiler(name);
    return <Component {...props} />;
  };
}
