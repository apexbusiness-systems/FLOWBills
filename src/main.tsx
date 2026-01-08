import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n/config";
import { applySPNonce } from "./lib/security";
import { performanceMonitor } from "./lib/performance-monitor";
import { queryOptimizer } from "./lib/query-optimizer";
import { startPersistenceCleanup } from "./lib/persistence";
import { ConfigErrorBoundary } from "./components/config/ConfigErrorBoundary";

// Mark module as loaded immediately
declare global {
  interface Window {
    __FLOWBILLS_LOADED__?: boolean;
  }
}
window.__FLOWBILLS_LOADED__ = true;

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

// CRITICAL FIX: Clear root element completely before React render
// This prevents React error #418 which occurs when React tries to hydrate existing content
rootElement.innerHTML = '';

// Render the app
console.log('[FlowBills] Starting React render');
const root = createRoot(rootElement);

// Helper function to remove loader
const removeLoader = () => {
  const loader = document.getElementById('flowbills-loader');
  if (loader) {
    loader.style.opacity = '0';
    loader.style.transition = 'opacity 0.3s ease';
    setTimeout(() => loader.remove(), 300);
  }
};

import('./App.tsx').then(({ default: App }) => {
  root.render(<App />);
  
  // Remove loader immediately after render
  removeLoader();

  // Signal successful mount
  setTimeout(() => {
    if (window.__FLOWBILLS_BOOT__) {
      window.__FLOWBILLS_BOOT__.stage = 'mounted';
      window.__FLOWBILLS_BOOT__.ts = Date.now();
    }
  }, 100);
}).catch((error) => {
  console.error('[FlowBills] App import failed:', error);
  const importError = error instanceof Error ? error : new Error(String(error));
  root.render(
    <React.StrictMode>
      <ConfigErrorBoundary error={importError} />
    </React.StrictMode>
  );

  // Remove loader even on error (error boundary shows instead)
  removeLoader();

  // Signal mounted (error boundary is a valid mounted state)
  setTimeout(() => {
    if (window.__FLOWBILLS_BOOT__) {
      window.__FLOWBILLS_BOOT__.stage = 'mounted';
      window.__FLOWBILLS_BOOT__.ts = Date.now();
    }
  }, 100);
});

// Define global helper for safe loader removal
declare global {
  interface Window {
    removeFlowBillsLoader: () => void;
  }
}

window.removeFlowBillsLoader = () => {
  const loader = document.getElementById('flowbills-loader');
  if (loader) {
    loader.style.opacity = '0';
    loader.style.transition = 'opacity 0.5s ease';
    setTimeout(() => loader.remove(), 500);
  }
};
