// Asset optimization utilities for CDN configuration and performance

export interface AssetMetrics {
  url: string;
  size: number;
  loadTime: number;
  cached: boolean;
  type: 'image' | 'script' | 'style' | 'font' | 'other';
  timestamp: number;
}

export interface ImageOptimization {
  original: string;
  optimized: string;
  format: 'webp' | 'avif' | 'jpeg' | 'png';
  quality: number;
  width?: number;
  height?: number;
}

class AssetOptimizer {
  private static instance: AssetOptimizer;
  private assetMetrics: AssetMetrics[] = [];
  private imageCache: Map<string, ImageOptimization> = new Map();
  private resourceObserver?: PerformanceObserver;

  static getInstance(): AssetOptimizer {
    if (!AssetOptimizer.instance) {
      AssetOptimizer.instance = new AssetOptimizer();
    }
    return AssetOptimizer.instance;
  }

  constructor() {
    this.initializeResourceMonitoring();
    this.setupImageOptimization();
  }

  // Initialize resource loading monitoring
  private initializeResourceMonitoring() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      this.resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            this.recordAssetMetric(entry as PerformanceResourceTiming);
          }
        });
      });

      this.resourceObserver.observe({ type: 'resource', buffered: true });
    } catch (error) {
      console.warn('Resource monitoring not supported:', error);
    }
  }

  // Record asset loading metrics
  private recordAssetMetric(entry: PerformanceResourceTiming) {
    const url = entry.name;
    const size = entry.transferSize || entry.encodedBodySize || 0;
    const loadTime = entry.responseEnd - entry.startTime;
    const cached = entry.transferSize === 0 && entry.decodedBodySize > 0;
    
    const type = this.getAssetType(url);

    const metric: AssetMetrics = {
      url,
      size,
      loadTime,
      cached,
      type,
      timestamp: Date.now()
    };

    this.assetMetrics.push(metric);

    // Keep last 200 asset metrics
    if (this.assetMetrics.length > 200) {
      this.assetMetrics.shift();
    }

    // Warn on large assets or slow loading
    if (size > 1024 * 1024) { // > 1MB
      console.warn(`Large asset detected: ${url} (${(size / 1024 / 1024).toFixed(2)}MB)`);
    }

    if (loadTime > 3000) { // > 3s
      console.warn(`Slow loading asset: ${url} (${(loadTime / 1000).toFixed(1)}s)`);
    }
  }

  // Determine asset type from URL
  private getAssetType(url: string): AssetMetrics['type'] {
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'].includes(extension || '')) {
      return 'image';
    }
    if (['js', 'mjs', 'jsx', 'ts', 'tsx'].includes(extension || '')) {
      return 'script';
    }
    if (['css', 'scss', 'sass'].includes(extension || '')) {
      return 'style';
    }
    if (['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(extension || '')) {
      return 'font';
    }
    
    return 'other';
  }

  // Setup image optimization
  private setupImageOptimization() {
    if (typeof window === 'undefined') return;

    // Lazy loading for images
    this.enableLazyLoading();
    
    // Preload critical images
    this.preloadCriticalImages();
  }

  // Enable lazy loading for images
  private enableLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      // Observe all lazy images
      document.querySelectorAll('img[data-src]').forEach((img) => {
        imageObserver.observe(img);
      });
    }
  }

  // Preload critical images
  private preloadCriticalImages() {
    const criticalImages = [
      '/hero-oilgas.jpg',
      // Add more critical images here
    ];

    criticalImages.forEach((src) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }

  // Optimize image URL with CDN parameters
  optimizeImageUrl(
    src: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'avif' | 'auto';
    } = {}
  ): string {
    // For demonstration - in production you'd integrate with your CDN
    const { width, height, quality = 80, format = 'auto' } = options;
    
    // Example CDN URL transformation
    let optimizedUrl = src;
    const params = new URLSearchParams();
    
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    if (quality) params.set('q', quality.toString());
    if (format !== 'auto') params.set('f', format);
    
    if (params.toString()) {
      optimizedUrl += (src.includes('?') ? '&' : '?') + params.toString();
    }

    // Cache the optimization
    this.imageCache.set(src, {
      original: src,
      optimized: optimizedUrl,
      format: format === 'auto' ? 'webp' : format,
      quality,
      width,
      height
    });

    return optimizedUrl;
  }

  // Generate responsive image srcset
  generateResponsiveSrcSet(src: string, sizes: number[]): string {
    return sizes
      .map((size) => `${this.optimizeImageUrl(src, { width: size })} ${size}w`)
      .join(', ');
  }

  // Generate sizes attribute for responsive images
  generateSizesAttribute(breakpoints: { size: string; width: number }[]): string {
    return breakpoints
      .map(({ size, width }) => `(max-width: ${width}px) ${size}`)
      .join(', ');
  }

  // Prefetch important resources
  prefetchResources(urls: string[]) {
    urls.forEach((url) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  // Preconnect to external domains
  preconnectDomains(domains: string[]) {
    domains.forEach((domain) => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      document.head.appendChild(link);
    });
  }

  // Get asset performance analytics
  getAssetAnalytics() {
    const totalAssets = this.assetMetrics.length;
    const cachedAssets = this.assetMetrics.filter(a => a.cached).length;
    const totalSize = this.assetMetrics.reduce((sum, a) => sum + a.size, 0);
    const avgLoadTime = this.assetMetrics.reduce((sum, a) => sum + a.loadTime, 0) / totalAssets;

    const assetsByType = this.assetMetrics.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    }, {} as Record<AssetMetrics['type'], number>);

    const largeAssets = this.assetMetrics
      .filter(a => a.size > 500 * 1024) // > 500KB
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    const slowAssets = this.assetMetrics
      .filter(a => a.loadTime > 1000) // > 1s
      .sort((a, b) => b.loadTime - a.loadTime)
      .slice(0, 10);

    return {
      totalAssets,
      cachedAssets,
      cacheHitRate: totalAssets > 0 ? (cachedAssets / totalAssets * 100).toFixed(1) + '%' : '0%',
      totalSize: (totalSize / 1024 / 1024).toFixed(2) + 'MB',
      avgLoadTime: avgLoadTime.toFixed(2) + 'ms',
      assetsByType,
      largeAssets,
      slowAssets,
      optimizedImages: this.imageCache.size
    };
  }

  // Enable service worker for caching
  async enableServiceWorker() {
    if (import.meta.env.DEV) {
      console.log('Service worker registration is centralized in src/lib/sw.ts');
    }
  }

  // Export asset data
  exportAssetData() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.assetMetrics,
      optimizedImages: Array.from(this.imageCache.values()),
      analytics: this.getAssetAnalytics()
    };
  }

  // Clear metrics
  clearMetrics() {
    this.assetMetrics = [];
    this.imageCache.clear();
  }
}

// CDN configuration utilities
export const CDNConfig = {
  // Configure CDN headers for different asset types
  getOptimalHeaders: (assetType: AssetMetrics['type']) => {
    const baseHeaders = {
      'Cache-Control': 'public, max-age=31536000', // 1 year
      'Expires': new Date(Date.now() + 31536000000).toUTCString()
    };

    switch (assetType) {
      case 'image':
        return {
          ...baseHeaders,
          'Cache-Control': 'public, max-age=2592000', // 30 days
          'Vary': 'Accept'
        };
      case 'font':
        return {
          ...baseHeaders,
          'Cache-Control': 'public, max-age=31536000, immutable' // 1 year, immutable
        };
      case 'script':
      case 'style':
        return {
          ...baseHeaders,
          'Cache-Control': 'public, max-age=31536000, immutable' // 1 year, immutable
        };
      default:
        return baseHeaders;
    }
  },

  // Get compression settings
  getCompressionConfig: () => ({
    gzip: {
      enabled: true,
      level: 6,
      types: ['text/html', 'text/css', 'application/javascript', 'application/json']
    },
    brotli: {
      enabled: true,
      level: 6,
      types: ['text/html', 'text/css', 'application/javascript', 'application/json']
    }
  })
};

export const assetOptimizer = AssetOptimizer.getInstance();
