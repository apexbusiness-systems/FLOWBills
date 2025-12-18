import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";
import { applySPNonce } from "./lib/security";
import { performanceMonitor } from "./lib/performance-monitor";
import { queryOptimizer } from "./lib/query-optimizer";
import { startPersistenceCleanup } from "./lib/persistence";
import { logger } from "./lib/logger";

// Mark module as loaded immediately
declare global {
  interface Window {
    __FLOWBILLS_LOADED__?: boolean;
  }
}
window.__FLOWBILLS_LOADED__ = true;
logger.debug('[FlowBills] Module loaded');

// Global error handlers
window.addEventListener('error', (event) => {
  logger.error('[FlowBills] Uncaught error', new Error(event.message), {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('[FlowBills] Unhandled rejection', event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
});

// Apply CSP nonce at runtime
applySPNonce();

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

// Render the app
logger.debug('[FlowBills] Starting React render');
createRoot(rootElement).render(<App />);

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
