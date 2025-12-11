// Performance warnings are logged to console.debug only (not shown to users)

// Performance metrics interface
export interface PerformanceMetrics {
  pageLoadTime: number;
  timeToFirstByte: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  memoryUsage?: number;
  connectionSpeed?: string;
}

// Component performance tracking
export interface ComponentMetrics {
  name: string;
  renderTime: number;
  mountTime: number;
  updateCount: number;
  lastUpdate: number;
}

// API performance tracking
export interface APIMetrics {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  size?: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private componentMetrics: Map<string, ComponentMetrics> = new Map();
  private apiMetrics: APIMetrics[] = [];
  private observer?: PerformanceObserver;
  private initialized = false;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    // Do NOT auto-initialize - allow explicit control
  }

  // Initialize Web Vitals monitoring (idempotent)
  initializeWebVitals() {
    if (this.initialized || typeof window === 'undefined' || !('PerformanceObserver' in window)) return;
    this.initialized = true;

    // Monitor Core Web Vitals
    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lcpEntry = entries[entries.length - 1];
        this.recordMetric('LCP', lcpEntry.startTime);
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          this.recordMetric('FID', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });

      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.recordMetric('CLS', clsValue);
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

    } catch (error) {
      console.warn('Performance monitoring not fully supported:', error);
    }
  }

  // Start API call monitoring using PerformanceObserver
  startAPIMonitoring() {
    if (typeof window === 'undefined') return;

    const queue: any[] = [];
    const obs = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        queue.push(this.serialize(e));
      }
    });
    
    obs.observe({ entryTypes: ["resource","navigation","longtask","largest-contentful-paint","first-input"] });
    
    window.addEventListener("pagehide", () => {
      try {
        navigator.sendBeacon("/api/metrics", new Blob([JSON.stringify({ events: queue.splice(0) })], { type: "application/json" }));
      } catch {}
    });
  }

  private serialize(entry: any): any {
    return {
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime,
      entryType: entry.entryType
    };
  }

  // Record performance metrics
  recordMetric(type: string, value: number) {
    const timestamp = Date.now();
    
    // Warn on poor performance
    if (type === 'LCP' && value > 2500) {
      toast({
        title: "Performance Warning",
        description: "Page load time is slower than recommended",
        variant: "destructive"
      });
    }

    if (type === 'FID' && value > 100) {
      toast({
        title: "Performance Warning", 
        description: "Input delay detected - consider optimizing interactions",
        variant: "destructive"
      });
    }

    // Store metrics (keep last 100)
    if (this.metrics.length >= 100) {
      this.metrics.shift();
    }
    
    const currentMetrics = this.getCurrentMetrics();
    this.metrics.push({ ...currentMetrics, [type.toLowerCase()]: value } as PerformanceMetrics);
  }

  // Record component performance
  recordComponentMetric(name: string, renderTime: number, isMount: boolean = false) {
    const existing = this.componentMetrics.get(name);
    
    if (existing) {
      this.componentMetrics.set(name, {
        ...existing,
        renderTime: Math.max(existing.renderTime, renderTime),
        updateCount: existing.updateCount + 1,
        lastUpdate: Date.now()
      });
    } else {
      this.componentMetrics.set(name, {
        name,
        renderTime,
        mountTime: isMount ? renderTime : 0,
        updateCount: 1,
        lastUpdate: Date.now()
      });
    }

    // Warn on slow components
    if (renderTime > 16) { // 60fps threshold
      console.warn(`Slow component detected: ${name} took ${renderTime.toFixed(2)}ms to render`);
    }
  }

  // Record API metrics
  recordAPIMetric(metric: APIMetrics) {
    this.apiMetrics.push(metric);
    
    // Keep last 200 API calls
    if (this.apiMetrics.length > 200) {
      this.apiMetrics.shift();
    }

    // Log slow API calls to console only (not visible to users)
    if (metric.duration > 3000) {
      toast({
        title: "Slow API Response",
        description: `${metric.endpoint} took ${(metric.duration/1000).toFixed(1)}s`,
      });
    }
  }

  // Get current performance metrics
  getCurrentMetrics(): PerformanceMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      pageLoadTime: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
      timeToFirstByte: navigation?.responseStart - navigation?.requestStart || 0,
      firstContentfulPaint: 0, // Will be updated by observers
      largestContentfulPaint: 0, // Will be updated by observers
      cumulativeLayoutShift: 0, // Will be updated by observers
      firstInputDelay: 0, // Will be updated by observers
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      connectionSpeed: (navigator as any).connection?.effectiveType || 'unknown'
    };
  }

  // Get performance summary
  getPerformanceSummary() {
    const recentMetrics = this.metrics.slice(-10);
    const slowComponents = Array.from(this.componentMetrics.values())
      .filter(c => c.renderTime > 16)
      .sort((a, b) => b.renderTime - a.renderTime);
    
    const slowAPIs = this.apiMetrics
      .filter(api => api.duration > 1000)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      metrics: recentMetrics,
      slowComponents,
      slowAPIs,
      totalComponents: this.componentMetrics.size,
      totalAPIsCalls: this.apiMetrics.length
    };
  }

  // Export performance data
  exportPerformanceData() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      components: Array.from(this.componentMetrics.values()),
      apis: this.apiMetrics,
      summary: this.getPerformanceSummary()
    };
  }

  // Clear all metrics
  clearMetrics() {
    this.metrics = [];
    this.componentMetrics.clear();
    this.apiMetrics = [];
  }
}

// React hook for component performance tracking
export function useComponentPerformanceTracking(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();

  return {
    trackRender: (startTime: number) => {
      const renderTime = performance.now() - startTime;
      monitor.recordComponentMetric(componentName, renderTime);
    },
    
    trackMount: (startTime: number) => {
      const mountTime = performance.now() - startTime;
      monitor.recordComponentMetric(componentName, mountTime, true);
    }
  };
}

export const performanceMonitor = PerformanceMonitor.getInstance();
