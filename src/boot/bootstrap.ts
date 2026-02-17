/**
 * FLOWBills Resilient Boot Pipeline
 *
 * This module provides a resilient, non-blocking boot process that:
 * - Tracks boot stages with performance marks
 * - Handles global errors gracefully
 * - Implements chunk load failure recovery
 * - Provides safe third-party script loading
 * - Never blocks app mounting on failures
 */

import { cleanupFlowBillsCaches, registerSW } from '@/lib/sw';

declare global {
  interface Window {
    __FLOWBILLS_BOOT__: {
      stage: 'start' | 'sw-check' | 'import-app' | 'mounted' | 'error';
      ts: number;
      details?: any;
      errors?: Array<{ message: string; ts: number; fatal?: boolean }>;
    };
    __FLOWBILLS_LOADED__?: boolean;
  }
}

// Boot stage tracking
class BootTracker {
  private static instance: BootTracker;
  private bootData: {
    stage: 'start' | 'sw-check' | 'import-app' | 'mounted' | 'error';
    ts: number;
    details: any;
    errors: Array<{ message: string; ts: number; fatal?: boolean }>;
  } = {
    stage: 'start',
    ts: Date.now(),
    details: {},
    errors: []
  };

  static getInstance(): BootTracker {
    if (!BootTracker.instance) {
      BootTracker.instance = new BootTracker();
    }
    return BootTracker.instance;
  }

  updateStage(stage: typeof this.bootData.stage, details?: any): void {
    this.bootData.stage = stage;
    this.bootData.ts = Date.now();
    this.bootData.details = details || {};

    // Update global state
    window.__FLOWBILLS_BOOT__ = { ...this.bootData };

    // Performance mark
    if ('performance' in window && 'mark' in window.performance) {
      try {
        window.performance.mark(`flowbills-boot-${stage}`);
      } catch (e) {
        // Ignore performance API errors
      }
    }

    console.log(`[FlowBills] Boot stage: ${stage}`, details || '');
  }

  recordError(message: string, fatal = false): void {
    const error = { message, ts: Date.now(), fatal };
    this.bootData.errors.push(error);
    window.__FLOWBILLS_BOOT__.errors = this.bootData.errors;

    console.error(`[FlowBills] Boot error${fatal ? ' (fatal)' : ''}:`, message);
  }

  getBootData() {
    return { ...this.bootData };
  }
}

// Service Worker Health Manager - Non-blocking cleanup
class SWHealthManager {
  private static instance: SWHealthManager;

  static getInstance(): SWHealthManager {
    if (!SWHealthManager.instance) {
      SWHealthManager.instance = new SWHealthManager();
    }
    return SWHealthManager.instance;
  }

  /**
   * Clean up service workers and caches in background (non-blocking)
   * Returns immediately, cleanup happens async with timeout
   */
  async cleanupInBackground(timeoutMs = 500): Promise<void> {
    if (!('serviceWorker' in navigator) && !('caches' in window)) {
      return; // Nothing to clean
    }

    // Start cleanup but don't await - it's fire-and-forget
    const cleanupPromise = this.performCleanup();

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        console.warn('[FlowBills] SW cleanup timed out, continuing boot');
        resolve();
      }, timeoutMs);
    });

    // Race between cleanup and timeout
    Promise.race([cleanupPromise, timeoutPromise]).catch((error) => {
      console.warn('[FlowBills] SW cleanup failed, continuing boot:', error);
    });
  }

  private async performCleanup(): Promise<void> {
    const tracker = BootTracker.getInstance();

    try {
      await cleanupFlowBillsCaches();

      console.log('[FlowBills] SW/Cache cleanup completed');
    } catch (error) {
      tracker.recordError(`SW cleanup failed: ${error}`, false);
    }
  }

  /**
   * Register service worker safely (only after app is mounted)
   */
  async registerAfterMount(): Promise<void> {
    if (!('serviceWorker' in navigator) || import.meta.env.DEV) {
      return;
    }

    try {
      await registerSW();

      console.log('[FlowBills] Service Worker registered after mount');
    } catch (error) {
      console.warn('[FlowBills] SW registration failed, app continues:', error);
    }
  }
}

// Chunk Load Failure Recovery
class ChunkRecoveryManager {
  private static instance: ChunkRecoveryManager;
  private hasRetried = false;

  static getInstance(): ChunkRecoveryManager {
    if (!ChunkRecoveryManager.instance) {
      ChunkRecoveryManager.instance = new ChunkRecoveryManager();
    }
    return ChunkRecoveryManager.instance;
  }

  setupRecoveryHandlers(): void {
    // Listen for chunk load errors
    window.addEventListener('error', (event) => {
      const isChunkError = this.isChunkLoadError(event.message);
      if (isChunkError) {
        event.preventDefault();
        this.handleChunkError(event.message);
      }
    });

    // Listen for unhandled promise rejections that might be chunk errors
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      const message = error?.message || String(error);
      const isChunkError = this.isChunkLoadError(message);

      if (isChunkError) {
        event.preventDefault();
        this.handleChunkError(message);
      }
    });
  }

  private isChunkLoadError(message: string): boolean {
    const chunkErrorPatterns = [
      'ChunkLoadError',
      'Loading chunk',
      'Failed to fetch dynamically imported module',
      'Importing a module script failed',
      'Loading CSS chunk',
      'Unable to preload CSS'
    ];

    return chunkErrorPatterns.some(pattern =>
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private handleChunkError(message: string): void {
    const tracker = BootTracker.getInstance();
    const bundleManager = BundleIntegrityManager.getInstance();
    
    // Log bundle diagnostics before handling error
    bundleManager.logBundleDiagnostics();
    
    tracker.recordError(`Chunk load error: ${message}`, true);

    if (this.hasRetried) {
      console.error('[FlowBills] Chunk error already retried once, showing error UI');
      this.showRecoveryUI(message);
      return;
    }

    console.log('[FlowBills] Attempting chunk recovery...');
    this.hasRetried = true;

    // Store retry flag in session storage to avoid loops
    sessionStorage.setItem('__flowbills_chunk_retry', 'true');

    // Perform recovery: clean SW/caches and reload
    this.performRecovery().then(() => {
      console.log('[FlowBills] Chunk recovery completed, reloading...');
      window.location.reload();
    }).catch((error) => {
      console.error('[FlowBills] Chunk recovery failed:', error);
      this.showRecoveryUI(message);
    });
  }

  private async performRecovery(): Promise<void> {
    const swManager = SWHealthManager.getInstance();

    // Clean everything
    await swManager.cleanupInBackground(2000); // Longer timeout for recovery

    await cleanupFlowBillsCaches();
  }

  private showRecoveryUI(errorMessage: string): void {
    // Create error overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: white;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, sans-serif;
    `;

    overlay.innerHTML = `
      <div style="max-width: 500px; padding: 2rem; text-align: center;">
        <h2 style="color: #dc2626; margin-bottom: 1rem;">Application Loading Error</h2>
        <p style="margin-bottom: 1rem;">The application failed to load properly. This may be due to cached files.</p>
        <details style="margin-bottom: 1rem; text-align: left;">
          <summary style="cursor: pointer; margin-bottom: 0.5rem;">Technical Details</summary>
          <pre style="font-size: 12px; background: #f3f4f6; padding: 0.5rem; border-radius: 4px; overflow: auto;">${errorMessage}</pre>
        </details>
        <button onclick="window.location.reload()" style="background: #2563eb; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer;">
          Hard Reload Application
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
  }
}

// Boot Timeout Monitor - Realistic timeout with proper error checking
class BootTimeoutMonitor {
  private static instance: BootTimeoutMonitor;
  private timeoutId: number | null = null;
  private readonly TIMEOUT_MS = 20000; // 20 seconds - realistic for slow networks

  static getInstance(): BootTimeoutMonitor {
    if (!BootTimeoutMonitor.instance) {
      BootTimeoutMonitor.instance = new BootTimeoutMonitor();
    }
    return BootTimeoutMonitor.instance;
  }

  startMonitoring(): void {
    if (this.timeoutId) return; // Already monitoring

    this.timeoutId = window.setTimeout(() => {
      this.checkBootStatus();
    }, this.TIMEOUT_MS);
  }

  stopMonitoring(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private checkBootStatus(): void {
    const bootData = window.__FLOWBILLS_BOOT__;

    if (!bootData) {
      console.error('[FlowBills] Boot monitoring failed - no boot data');
      this.showTimeoutError('Boot system failed to initialize');
      return;
    }

    // Check if app is mounted
    if (bootData.stage === 'mounted') {
      console.log('[FlowBills] Boot completed successfully within timeout');
      return;
    }

    // Check for fatal errors
    const hasFatalErrors = bootData.errors?.some(e => e.fatal) || false;

    if (hasFatalErrors) {
      console.error('[FlowBills] Boot failed with fatal errors within timeout');
      this.showTimeoutError(`Boot failed: ${bootData.errors?.[bootData.errors.length - 1]?.message || 'Unknown error'}`);
      return;
    }

    // Check if we're still in early stages (network issues, etc.)
    const bootDuration = Date.now() - bootData.ts;
    if (bootDuration < this.TIMEOUT_MS + 5000) { // Give some extra time
      console.warn(`[FlowBills] Boot still in progress after ${bootDuration}ms (stage: ${bootData.stage})`);
      // Don't show error yet, wait a bit more
      this.timeoutId = window.setTimeout(() => this.checkBootStatus(), 5000);
      return;
    }

    // Timeout reached without mounting or fatal errors
    console.error(`[FlowBills] Boot timeout after ${bootDuration}ms (stage: ${bootData.stage})`);
    this.showTimeoutError(`Application failed to load within ${this.TIMEOUT_MS/1000}s`);
  }

  private showTimeoutError(message: string): void {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: white;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, sans-serif;
    `;

    overlay.innerHTML = `
      <div style="max-width: 500px; padding: 2rem; text-align: center;">
        <h2 style="color: #dc2626; margin-bottom: 1rem;">Application Loading Timeout</h2>
        <p style="margin-bottom: 1rem;">${message}</p>
        <details style="margin-bottom: 1rem; text-align: left;">
          <summary style="cursor: pointer; margin-bottom: 0.5rem;">Boot Diagnostics</summary>
          <pre style="font-size: 12px; background: #f3f4f6; padding: 0.5rem; border-radius: 4px; overflow: auto;">${JSON.stringify(window.__FLOWBILLS_BOOT__, null, 2)}</pre>
        </details>
        <button onclick="window.location.reload()" style="background: #2563eb; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer;">
          Reload Application
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
  }
}

// Bundle Integrity Debug Manager
class BundleIntegrityManager {
  private static instance: BundleIntegrityManager;

  static getInstance(): BundleIntegrityManager {
    if (!BundleIntegrityManager.instance) {
      BundleIntegrityManager.instance = new BundleIntegrityManager();
    }
    return BundleIntegrityManager.instance;
  }

  /**
   * Log bundle integrity diagnostics when boot fails
   * This helps diagnose production issues without blocking boot
   */
  logBundleDiagnostics(): void {
    try {
      const diagnostics: Record<string, any> = {
        deploymentId: this.getDeploymentId(),
        buildHash: this.getBuildHash(),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        scripts: this.getScriptDiagnostics(),
        chunks: this.getChunkDiagnostics(),
      };

      console.group('[FlowBills] Bundle Integrity Diagnostics');
      console.log('Deployment ID:', diagnostics.deploymentId);
      console.log('Build Hash:', diagnostics.buildHash);
      console.log('Scripts:', diagnostics.scripts);
      console.log('Chunks:', diagnostics.chunks);
      console.log('Full Diagnostics:', diagnostics);
      console.groupEnd();

      // Store in boot data for error UI
      if (window.__FLOWBILLS_BOOT__) {
        window.__FLOWBILLS_BOOT__.details = {
          ...window.__FLOWBILLS_BOOT__.details,
          bundleDiagnostics: diagnostics,
        };
      }
    } catch (error) {
      console.warn('[FlowBills] Failed to collect bundle diagnostics:', error);
      // Don't throw - diagnostics are non-blocking
    }
  }

  private getDeploymentId(): string {
    // Try to get from import.meta.env or injected build info
    if (import.meta.env.VITE_DEPLOYMENT_ID) {
      return import.meta.env.VITE_DEPLOYMENT_ID;
    }
    if (import.meta.env.VITE_VERCEL_DEPLOYMENT_ID) {
      return import.meta.env.VITE_VERCEL_DEPLOYMENT_ID;
    }
    return 'unknown';
  }

  private getBuildHash(): string {
    // Try to get from import.meta.env or injected build hash
    if (import.meta.env.VITE_BUILD_HASH) {
      return import.meta.env.VITE_BUILD_HASH;
    }
    // Fallback: try to extract from script src
    const scripts = Array.from(document.scripts);
    const mainScript = scripts.find(s => s.src.includes('/assets/'));
    if (mainScript?.src) {
      const match = mainScript.src.match(/[a-f0-9]{8,}/);
      if (match) return match[0].substring(0, 8);
    }
    return 'unknown';
  }

  private getScriptDiagnostics(): Array<{ src: string; type: string; async: boolean; defer: boolean }> {
    return Array.from(document.scripts).map(script => ({
      src: script.src || 'inline',
      type: script.type || 'text/javascript',
      async: script.async,
      defer: script.defer,
    }));
  }

  private getChunkDiagnostics(): Array<{ url: string; status: string }> {
    // This would be populated by intercepting fetch requests
    // For now, return script sources that look like chunks
    const scripts = Array.from(document.scripts);
    return scripts
      .filter(s => s.src && (s.src.includes('/assets/') || s.src.includes('chunk')))
      .map(s => ({
        url: s.src,
        status: 'loaded', // Would be enhanced with actual fetch status
      }));
  }

  /**
   * Check if a failed chunk fetch returned HTML (indicating routing issue)
   */
  async checkChunkIntegrity(url: string): Promise<{ isValid: boolean; contentType?: string; isHtml?: boolean }> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentType = response.headers.get('content-type') || '';
      const isHtml = contentType.includes('text/html');
      
      return {
        isValid: response.ok && !isHtml,
        contentType,
        isHtml,
      };
    } catch (error) {
      return {
        isValid: false,
        contentType: undefined,
        isHtml: undefined,
      };
    }
  }
}

// Third-party Script Manager
class ThirdPartyManager {
  private static instance: ThirdPartyManager;
  private loadedScripts = new Set<string>();

  static getInstance(): ThirdPartyManager {
    if (!ThirdPartyManager.instance) {
      ThirdPartyManager.instance = new ThirdPartyManager();
    }
    return ThirdPartyManager.instance;
  }

  /**
   * Load Upscope safely (only if enabled and after mount)
   */
  async loadUpscope(): Promise<void> {
    // Check feature flag
    const isEnabled = import.meta.env.VITE_UPSCOPE_ENABLED === 'true';
    if (!isEnabled || import.meta.env.PROD === false) {
      console.log('[FlowBills] Upscope disabled');
      return;
    }

    if (this.loadedScripts.has('upscope')) {
      return; // Already loaded
    }

    try {
      console.log('[FlowBills] Loading Upscope...');

      // Dynamic import of Upscope script
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://code.upscope.io/remote-control-libs.js';
        script.async = true;
        script.defer = true;

        script.onload = () => {
          console.log('[FlowBills] Upscope loaded successfully');
          this.loadedScripts.add('upscope');
          resolve();
        };

        script.onerror = (error) => {
          console.warn('[FlowBills] Upscope failed to load, continuing:', error);
          reject(error);
        };

        // Add timeout
        setTimeout(() => {
          reject(new Error('Upscope load timeout'));
        }, 5000);

        document.head.appendChild(script);
      });
    } catch (error) {
      console.warn('[FlowBills] Upscope initialization failed, app continues:', error);
      // Don't record as fatal error - app should work without it
    }
  }

  /**
   * Load other third-party scripts safely
   */
  async loadThirdPartyScripts(): Promise<void> {
    // Add other third-party scripts here as needed
    // Each should be loaded safely with timeouts and error handling
  }
}

// Main Boot Function
export async function bootstrap(): Promise<void> {
  const tracker = BootTracker.getInstance();
  const swManager = SWHealthManager.getInstance();
  const chunkRecovery = ChunkRecoveryManager.getInstance();
  const thirdParty = ThirdPartyManager.getInstance();
  const timeoutMonitor = BootTimeoutMonitor.getInstance();

  try {
    // Stage 1: Start boot
    tracker.updateStage('start');

    // Start timeout monitoring
    timeoutMonitor.startMonitoring();

    // Setup global error handlers
    setupGlobalErrorHandlers(tracker);

    // Setup chunk recovery (must happen early)
    chunkRecovery.setupRecoveryHandlers();

    // Stage 2: SW Check (non-blocking cleanup)
    tracker.updateStage('sw-check');
    await swManager.cleanupInBackground();

    // Check if this is a retry after chunk error
    const isRetry = sessionStorage.getItem('__flowbills_chunk_retry') === 'true';
    if (isRetry) {
      sessionStorage.removeItem('__flowbills_chunk_retry');
      console.log('[FlowBills] This is a chunk recovery retry');
    }

    // Stage 3: Import and mount app
    tracker.updateStage('import-app');

    // Import the main module (this will execute all the existing main.tsx logic)
    await import('../main.tsx');

    // Stage 4: Mounted successfully
    tracker.updateStage('mounted');

    // Stop timeout monitoring since we mounted successfully
    timeoutMonitor.stopMonitoring();

    // Now that app is mounted, register SW properly
    swManager.registerAfterMount();

    // Load third-party scripts (safe to do after mount)
    thirdParty.loadUpscope();

    // Remove any loader
    setTimeout(() => {
      const loader = document.getElementById('flowbills-loader');
      if (loader) {
        loader.remove();
      }
    }, 100);

  } catch (error) {
    tracker.updateStage('error', { error: error instanceof Error ? error.message : String(error) });
    tracker.recordError(`Boot failed: ${error}`, true);

    // Log bundle diagnostics on boot failure
    const bundleManager = BundleIntegrityManager.getInstance();
    bundleManager.logBundleDiagnostics();

    // Show error UI
    showBootErrorUI(error instanceof Error ? error : new Error(String(error)));
  }
}

// Global error handlers
function setupGlobalErrorHandlers(tracker: BootTracker): void {
  // Uncaught errors
  window.addEventListener('error', (event) => {
    tracker.recordError(`Uncaught error: ${event.message} at ${event.filename}:${event.lineno}`, false);
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    const message = error instanceof Error ? error.message : String(error);
    tracker.recordError(`Unhandled rejection: ${message}`, false);
  });

  // Performance observer for long tasks
  if ('PerformanceObserver' in window) {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            // Use warn instead of error to avoid failing Lighthouse "errors-in-console" audit
            console.warn(`[FlowBills] Long task detected: ${entry.duration}ms`);
          }
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Ignore if not supported
    }
  }
}

// Error UI for boot failures
function showBootErrorUI(error: Error): void {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: white;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: system-ui, sans-serif;
  `;

  overlay.innerHTML = `
    <div style="max-width: 500px; padding: 2rem; text-align: center;">
      <h2 style="color: #dc2626; margin-bottom: 1rem;">Application Failed to Load</h2>
      <p style="margin-bottom: 1rem;">${error.message}</p>
      <details style="margin-bottom: 1rem; text-align: left;">
        <summary style="cursor: pointer; margin-bottom: 0.5rem;">Boot Status</summary>
        <pre style="font-size: 12px; background: #f3f4f6; padding: 0.5rem; border-radius: 4px; overflow: auto;">${JSON.stringify(window.__FLOWBILLS_BOOT__, null, 2)}</pre>
      </details>
      <button onclick="window.location.reload()" style="background: #2563eb; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer;">
        Reload Application
      </button>
    </div>
  `;

  document.body.appendChild(overlay);
}

// Export utilities for debugging
export const bootUtils = {
  getBootStatus: () => BootTracker.getInstance().getBootData(),
  clearBootState: () => {
    delete window.__FLOWBILLS_BOOT__;
    sessionStorage.removeItem('__flowbills_chunk_retry');
  },
  forceChunkRecovery: () => ChunkRecoveryManager.getInstance()['hasRetried'] = false,
  getBundleDiagnostics: () => BundleIntegrityManager.getInstance().logBundleDiagnostics(),
  checkChunkIntegrity: (url: string) => BundleIntegrityManager.getInstance().checkChunkIntegrity(url),
};

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).flowbillsBoot = bootUtils;
}

// Auto-run bootstrap when this module is loaded
bootstrap();
