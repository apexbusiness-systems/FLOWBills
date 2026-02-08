/**
 * Production Performance Optimizations
 * Implements production-ready performance enhancements
 */

import { performanceMonitor } from './performance-monitor';
import { queryOptimizer } from './query-optimizer';

interface OptimizationConfig {
  enableCaching: boolean;
  enablePerformanceMonitoring: boolean;
  enableQueryOptimization: boolean;
  cacheSize: number;
  cacheTTL: number;
}

class ProductionOptimizer {
  private static instance: ProductionOptimizer;
  private config: OptimizationConfig = {
    enableCaching: true,
    enablePerformanceMonitoring: true,
    enableQueryOptimization: true,
    cacheSize: 100,
    cacheTTL: 300000, // 5 minutes
  };

  static getInstance(): ProductionOptimizer {
    if (!ProductionOptimizer.instance) {
      ProductionOptimizer.instance = new ProductionOptimizer();
    }
    return ProductionOptimizer.instance;
  }

  configure(config: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Initialize all production optimizations
   */
  initialize(): void {
    if (import.meta.env.DEV) {
      console.log('🚀 Production optimizations disabled in development');
      return;
    }

    console.log('🚀 Initializing production optimizations...');

    if (this.config.enablePerformanceMonitoring) {
      this.initializePerformanceMonitoring();
    }

    if (this.config.enableQueryOptimization) {
      this.initializeQueryOptimization();
    }

    if (this.config.enableCaching) {
      this.initializeCaching();
    }

    this.setupResourceHints();
    this.optimizeNetworkRequests();
    
    console.log('✅ Production optimizations initialized');
  }

  /**
   * Initialize performance monitoring (idempotent)
   */
  private initializePerformanceMonitoring(): void {
    performanceMonitor.initializeWebVitals();
    performanceMonitor.startAPIMonitoring();

    // Track navigation performance
    if ('performance' in window && 'getEntriesByType' in window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navTiming) {
            performanceMonitor.recordMetric('page-load', navTiming.loadEventEnd - navTiming.fetchStart);
            performanceMonitor.recordMetric('dom-interactive', navTiming.domInteractive - navTiming.fetchStart);
            performanceMonitor.recordMetric('ttfb', navTiming.responseStart - navTiming.requestStart);
          }
        }, 0);
      });
    }
  }

  /**
   * Initialize query optimization
   */
  private initializeQueryOptimization(): void {
    queryOptimizer.configure({
      ttl: this.config.cacheTTL,
    });
    queryOptimizer.startPeriodicCleanup();
  }

  /**
   * Initialize caching strategies
   */
  private initializeCaching(): void {
    // Implement stale-while-revalidate for API calls
    this.setupStaleWhileRevalidate();
  }

  /**
   * Setup resource hints for critical resources
   */
  private setupResourceHints(): void {
    // Preconnect to Supabase
    const preconnectLink = document.createElement('link');
    preconnectLink.rel = 'preconnect';
    preconnectLink.href = 'https://ullqluvzkgnwwqijhvjr.supabase.co';
    document.head.appendChild(preconnectLink);

    // DNS prefetch for external resources
    const dnsPrefetch = document.createElement('link');
    dnsPrefetch.rel = 'dns-prefetch';
    dnsPrefetch.href = 'https://ullqluvzkgnwwqijhvjr.supabase.co';
    document.head.appendChild(dnsPrefetch);
  }

  /**
   * Optimize network requests
   */
  private optimizeNetworkRequests(): void {
    // Implement request batching for multiple simultaneous requests
    const originalFetch = window.fetch;
    const pendingRequests = new Map<string, Promise<Response>>();

    window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input.toString();
      
      // Deduplicate identical requests
      if (init?.method === 'GET' || !init?.method) {
        if (pendingRequests.has(url)) {
          return pendingRequests.get(url)!.then(res => res.clone());
        }

        const fetchPromise = originalFetch(input, init);
        pendingRequests.set(url, fetchPromise);

        fetchPromise.finally(() => {
          pendingRequests.delete(url);
        });

        return fetchPromise;
      }

      return originalFetch(input, init);
    };
  }

  /**
   * Setup stale-while-revalidate caching pattern
   */
  private setupStaleWhileRevalidate(): void {
    const cache = new Map<string, { data: any; timestamp: number }>();
    const TTL = this.config.cacheTTL;

    // Intercept and cache GET requests
    const originalFetch = window.fetch;
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      if (init?.method && init.method !== 'GET') {
        return originalFetch(input, init);
      }

      const url = typeof input === 'string' ? input : input.toString();
      const cached = cache.get(url);
      const now = Date.now();

      if (cached && now - cached.timestamp < TTL) {
        // Return cached data while revalidating in background
        originalFetch(input, init).then(response => {
          response.clone().json().then(data => {
            cache.set(url, { data, timestamp: Date.now() });
          });
        });

        return new Response(JSON.stringify(cached.data), {
          headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
        });
      }

      // Fetch fresh data
      const response = await originalFetch(input, init);
      const clonedResponse = response.clone();
      
      clonedResponse.json().then(data => {
        cache.set(url, { data, timestamp: Date.now() });
      }).catch(() => {
        // Non-JSON response, skip caching
      });

      return response;
    };
  }

  /**
   * Get optimization metrics
   */
  getMetrics() {
    return {
      performance: performanceMonitor.getPerformanceSummary(),
      queries: queryOptimizer.getQueryAnalytics(),
      config: this.config,
    };
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    queryOptimizer.clearCache();
    queryOptimizer.clearMetrics();
    performanceMonitor.clearMetrics();
  }

  /**
   * Export optimization data for analysis
   */
  exportData() {
    return {
      timestamp: new Date().toISOString(),
      performance: performanceMonitor.exportPerformanceData(),
      queries: queryOptimizer.exportQueryData(),
      config: this.config,
    };
  }
}

export const productionOptimizer = ProductionOptimizer.getInstance();
