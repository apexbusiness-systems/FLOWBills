import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Query performance metrics
export interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: number;
  cached: boolean;
  rowCount?: number;
  endpoint?: string;
}

// Cache configuration
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache entries
}

// Query cache entry
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  hits: number;
}

class QueryOptimizer {
  private static instance: QueryOptimizer;
  private queryMetrics: QueryMetrics[] = [];
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes default
    maxSize: 1000
  };
  private cleanupInterval: NodeJS.Timeout | null = null;

  static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer();
    }
    return QueryOptimizer.instance;
  }

  constructor() {
    // Do NOT auto-start cleanup - allow explicit control
  }

  // Configure cache settings
  configure(config: Partial<CacheConfig>) {
    this.config = { ...this.config, ...config };
  }

  // Execute query with caching and performance tracking
  async executeQuery<T = any>(
    queryFn: () => Promise<{ data: T; error: any }>,
    cacheKey?: string,
    options: { ttl?: number; cache?: boolean } = {}
  ): Promise<{ data: T; error: any; fromCache?: boolean }> {
    const startTime = performance.now();
    const shouldCache = options.cache !== false && cacheKey;
    const ttl = options.ttl || this.config.ttl;

    // Check cache first
    if (shouldCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        const endTime = performance.now();
        this.recordQueryMetric({
          query: cacheKey,
          duration: endTime - startTime,
          timestamp: Date.now(),
          cached: true
        });
        return { data: cached, error: null, fromCache: true };
      }
    }

    try {
      // Execute query
      const result = await queryFn();
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Record performance metrics
      this.recordQueryMetric({
        query: cacheKey || 'anonymous',
        duration,
        timestamp: Date.now(),
        cached: false,
        rowCount: Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0
      });

      // Cache successful results
      if (shouldCache && !result.error && result.data) {
        this.setCache(cacheKey, result.data, ttl);
      }

      // Warn on slow queries
      if (duration > 2000) {
        toast({
          title: "Slow Query Detected",
          description: `Query took ${(duration/1000).toFixed(1)}s to complete`,
        });
      }

      return result;
    } catch (error) {
      const endTime = performance.now();
      this.recordQueryMetric({
        query: cacheKey || 'anonymous',
        duration: endTime - startTime,
        timestamp: Date.now(),
        cached: false
      });
      throw error;
    }
  }

  // Optimized Supabase query wrapper
  async supabaseQuery<T = any>(
    tableName: string,
    query: (client: typeof supabase) => Promise<any>,
    cacheKey?: string,
    options: { ttl?: number; cache?: boolean } = {}
  ) {
    return this.executeQuery(
      async () => {
        const result = await query(supabase);
        return result;
      },
      cacheKey || `${tableName}_query_${Date.now()}`,
      options
    );
  }

  // Batch query executor with connection pooling simulation
  async executeBatchQueries<T = any>(
    queries: Array<{
      fn: () => Promise<any>;
      cacheKey?: string;
      options?: { ttl?: number; cache?: boolean };
    }>
  ): Promise<T[]> {
    const batchStartTime = performance.now();

    // Execute queries in parallel with limited concurrency
    const concurrency = 5; // Limit concurrent queries
    const results: T[] = [];
    
    for (let i = 0; i < queries.length; i += concurrency) {
      const batch = queries.slice(i, i + concurrency);
      const batchPromises = batch.map(({ fn, cacheKey, options }) =>
        this.executeQuery(fn, cacheKey, options)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults as T[]);
    }

    const batchEndTime = performance.now();
    const batchDuration = batchEndTime - batchStartTime;

    this.recordQueryMetric({
      query: `batch_${queries.length}_queries`,
      duration: batchDuration,
      timestamp: Date.now(),
      cached: false
    });

    return results;
  }

  // Cache management
  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if cache entry is still valid
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count
    entry.hits++;
    return entry.data;
  }

  private setCache(key: string, data: any, ttl: number) {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.findLRUKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data: JSON.parse(JSON.stringify(data)), // Deep clone to prevent mutations
      timestamp: Date.now(),
      ttl,
      hits: 0
    });
  }

  private findLRUKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  // Periodic cache cleanup (idempotent)
  startPeriodicCleanup() {
    if (this.cleanupInterval) return; // Already started
    
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Cleanup every minute
  }

  // Stop cleanup (for cleanup/unmount)
  stopPeriodicCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // Record query metrics
  private recordQueryMetric(metric: QueryMetrics) {
    this.queryMetrics.push(metric);

    // Keep last 500 query metrics
    if (this.queryMetrics.length > 500) {
      this.queryMetrics.shift();
    }
  }

  // Get query performance analytics
  getQueryAnalytics() {
    const totalQueries = this.queryMetrics.length;
    const cachedQueries = this.queryMetrics.filter(q => q.cached).length;
    const avgDuration = this.queryMetrics.reduce((sum, q) => sum + q.duration, 0) / totalQueries;
    
    const slowQueries = this.queryMetrics
      .filter(q => q.duration > 1000)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const queryFrequency = this.queryMetrics.reduce((freq, q) => {
      freq[q.query] = (freq[q.query] || 0) + 1;
      return freq;
    }, {} as Record<string, number>);

    return {
      totalQueries,
      cachedQueries,
      cacheHitRate: totalQueries > 0 ? (cachedQueries / totalQueries * 100).toFixed(1) + '%' : '0%',
      avgDuration: avgDuration.toFixed(2) + 'ms',
      slowQueries,
      queryFrequency,
      cacheSize: this.cache.size,
      cacheEntries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        hits: entry.hits,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl
      }))
    };
  }

  // Clear cache and metrics
  clearCache() {
    this.cache.clear();
    toast({
      title: "Cache Cleared",
      description: "Query cache has been cleared successfully"
    });
  }

  clearMetrics() {
    this.queryMetrics = [];
  }

  // Export performance data
  exportQueryData() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.queryMetrics,
      analytics: this.getQueryAnalytics()
    };
  }
}

// Common query patterns with optimization
export const QueryPatterns = {
  // Paginated query with caching
  paginatedQuery: async <T>(
    tableName: 'invoices' | 'exceptions' | 'compliance_records' | 'activities',
    page: number = 1,
    pageSize: number = 10,
    filters: Record<string, any> = {}
  ) => {
    const optimizer = QueryOptimizer.getInstance();
    const cacheKey = `${tableName}_page_${page}_${pageSize}_${JSON.stringify(filters)}`;
    
    return optimizer.supabaseQuery(
      tableName,
      async (client) => await client
        .from(tableName as any)
        .select('*', { count: 'exact' })
        .range((page - 1) * pageSize, page * pageSize - 1)
        .match(filters),
      cacheKey,
      { ttl: 2 * 60 * 1000 } // 2 minutes cache for paginated data
    );
  },

  // Aggregation query with longer cache
  aggregationQuery: async (
    tableName: 'invoices' | 'exceptions' | 'compliance_records' | 'activities',
    aggregations: string[],
    filters: Record<string, any> = {}
  ) => {
    const optimizer = QueryOptimizer.getInstance();
    const cacheKey = `${tableName}_agg_${aggregations.join('_')}_${JSON.stringify(filters)}`;
    
    return optimizer.supabaseQuery(
      tableName,
      async (client) => await client
        .from(tableName as any)
        .select(aggregations.join(', '))
        .match(filters),
      cacheKey,
      { ttl: 10 * 60 * 1000 } // 10 minutes cache for aggregations
    );
  },

  // Real-time query (no cache)
  realtimeQuery: async <T>(
    tableName: 'invoices' | 'exceptions' | 'compliance_records' | 'activities',
    query: (client: typeof supabase) => Promise<any>
  ) => {
    const optimizer = QueryOptimizer.getInstance();
    return optimizer.supabaseQuery(tableName, query, undefined, { cache: false });
  }
};

export const queryOptimizer = QueryOptimizer.getInstance();
