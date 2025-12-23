import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";
import { applySPNonce } from "./lib/security";
import { performanceMonitor } from "./lib/performance-monitor";
import { queryOptimizer } from "./lib/query-optimizer";
import { startPersistenceCleanup } from "./lib/persistence";

// Mark module as loaded immediately
declare global {
  interface Window {
    __FLOWBILLS_LOADED__?: boolean;
  }
}
window.__FLOWBILLS_LOADED__ = true;
console.log('[FlowBills] Module loaded');

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('[FlowBills] Uncaught error:', event.message, event.filename, event.lineno);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[FlowBills] Unhandled rejection:', event.reason);
});

// Apply CSP nonce at runtime
try {
  applySPNonce();
} catch (error) {
  console.error('[FlowBills] Failed to apply CSP nonce:', error);
  throw error;
}

// Initialize performance monitoring - only in production
if (!import.meta.env.DEV) {
  const initPerformance = () => {
    performanceMonitor.initializeWebVitals();
    performanceMonitor.startAPIMonitoring();
    queryOptimizer.startPeriodicCleanup();
    startPersistenceCleanup();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPerformance);
  } else {
    initPerformance();
  }
} else {
  startPersistenceCleanup();
}

// Get root element
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

// CRITICAL FIX: Clear root element completely before React render
// This prevents React error #418 which occurs when React tries to hydrate existing content
rootElement.innerHTML = '';

// Render the app
console.log('[FlowBills] Starting React render');
try {
  const root = createRoot(rootElement);
  root.render(<App />);
} catch (error) {
  console.error('[FlowBills] React render failed:', error);
  throw error;
}

// Remove loader after React renders - simple approach
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    const loader = document.getElementById('flowbills-loader');
    if (loader) {
      logger.debug('[FlowBills] App rendered, removing loader');
      loader.remove();
    }
  });
});