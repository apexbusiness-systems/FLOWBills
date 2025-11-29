import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";
import { applySPNonce } from "./lib/security";
import { performanceMonitor } from "./lib/performance-monitor";
import { queryOptimizer } from "./lib/query-optimizer";
import { startPersistenceCleanup } from "./lib/persistence";

// Global error handlers to catch errors before React renders
window.addEventListener('error', (event) => {
  console.error('============================================');
  console.error('[FlowBills Global Error Handler] Uncaught error!');
  console.error('Error:', event.error);
  console.error('Message:', event.message);
  console.error('Filename:', event.filename);
  console.error('Line:', event.lineno);
  console.error('Column:', event.colno);
  console.error('Timestamp:', new Date().toISOString());
  console.error('============================================');
  
  // Store in localStorage for debugging
  try {
    const errorReport = {
      type: 'global_error',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error ? {
        name: event.error.name,
        message: event.error.message,
        stack: event.error.stack
      } : null,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    
    const existingErrors = JSON.parse(localStorage.getItem('global_errors') || '[]');
    existingErrors.push(errorReport);
    
    if (existingErrors.length > 10) {
      existingErrors.splice(0, existingErrors.length - 10);
    }
    
    localStorage.setItem('global_errors', JSON.stringify(existingErrors));
  } catch (storageError) {
    console.error('Failed to store global error:', storageError);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('============================================');
  console.error('[FlowBills Global Error Handler] Unhandled promise rejection!');
  console.error('Reason:', event.reason);
  console.error('Promise:', event.promise);
  console.error('Timestamp:', new Date().toISOString());
  console.error('============================================');
  
  // Store in localStorage for debugging
  try {
    const errorReport = {
      type: 'unhandled_rejection',
      reason: event.reason ? String(event.reason) : 'Unknown',
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    
    const existingErrors = JSON.parse(localStorage.getItem('global_errors') || '[]');
    existingErrors.push(errorReport);
    
    if (existingErrors.length > 10) {
      existingErrors.splice(0, existingErrors.length - 10);
    }
    
    localStorage.setItem('global_errors', JSON.stringify(existingErrors));
  } catch (storageError) {
    console.error('Failed to store unhandled rejection:', storageError);
  }
});

// Apply CSP nonce at runtime
applySPNonce();

// Initialize performance monitoring and persistence - only in production
if (!import.meta.env.DEV) {
  const initPerformance = () => {
    performanceMonitor.initializeWebVitals();
    performanceMonitor.startAPIMonitoring();
    queryOptimizer.startPeriodicCleanup();
    startPersistenceCleanup();
  };
  
  // Defer initialization to avoid blocking initial render
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPerformance);
  } else {
    initPerformance();
  }
} else {
  // Always start cleanup in dev too
  startPersistenceCleanup();
}

// Register service worker with health monitoring
import('./lib/sw-health-monitor').then(({ swHealthMonitor }) => {
  window.addEventListener('load', () => {
    swHealthMonitor.register();
  });
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  const errorMsg = "Root element not found - DOM may not be ready";
  console.error(errorMsg);
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; background: #f9fafb; font-family: system-ui, -apple-system, sans-serif;">
      <div style="max-width: 400px; text-align: center; background: white; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h1 style="color: #ef4444; margin-bottom: 16px;">Application Error</h1>
        <p style="color: #6b7280; margin-bottom: 24px;">Failed to initialize the application. Please refresh the page or contact support if the issue persists.</p>
        <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
          Reload Page
        </button>
      </div>
    </div>
  `;
  throw new Error(errorMsg);
}

try {
  createRoot(rootElement).render(<App />);
} catch (error) {
  console.error('============================================');
  console.error('[FlowBills] Failed to render React app!');
  console.error('Error:', error);
  console.error('============================================');
  
  // Display user-friendly error
  rootElement.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; background: #f9fafb; font-family: system-ui, -apple-system, sans-serif;">
      <div style="max-width: 400px; text-align: center; background: white; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h1 style="color: #ef4444; margin-bottom: 16px;">Render Error</h1>
        <p style="color: #6b7280; margin-bottom: 24px;">Failed to render the application. Please refresh the page or contact support if the issue persists.</p>
        <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
          Reload Page
        </button>
        ${import.meta.env.DEV ? `<pre style="margin-top: 16px; padding: 12px; background: #f3f4f6; border-radius: 4px; text-align: left; font-size: 12px; overflow-x: auto;">${error}</pre>` : ''}
      </div>
    </div>
  `;
}
