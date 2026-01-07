import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n/config";
import { applySPNonce } from "./lib/security";
import { performanceMonitor } from "./lib/performance-monitor";
import { queryOptimizer } from "./lib/query-optimizer";
import { startPersistenceCleanup } from "./lib/persistence";
import { ConfigErrorBoundary } from "./components/config/ConfigErrorBoundary";
import { validateSupabaseConfig } from "./lib/config-validator";

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

// Validate config before importing App (which imports Supabase client)
let configError: Error | null = null;
try {
  validateSupabaseConfig();
} catch (error) {
  configError = error instanceof Error ? error : new Error(String(error));
  configError.name = 'ConfigError';
  console.error('[FlowBills] Configuration error detected:', configError);
}

// Render the app - config errors will show ConfigErrorBoundary
console.log('[FlowBills] Starting React render');
const root = createRoot(rootElement);

if (configError) {
  // Render config error screen instead of app
  root.render(
    <React.StrictMode>
      <ConfigErrorBoundary error={configError} />
    </React.StrictMode>
  );

  // Signal mounted even for config errors (they are valid mounted states)
  setTimeout(() => {
    if (window.__FLOWBILLS_BOOT__) {
      window.__FLOWBILLS_BOOT__.stage = 'mounted';
      window.__FLOWBILLS_BOOT__.ts = Date.now();
    }
  }, 100);
} else {
  // Dynamically import App to avoid loading it if config is invalid
  import('./App.tsx').then(({ default: App }) => {
    root.render(<App />);

    // Signal successful mount
    setTimeout(() => {
      if (window.__FLOWBILLS_BOOT__) {
        window.__FLOWBILLS_BOOT__.stage = 'mounted';
        window.__FLOWBILLS_BOOT__.ts = Date.now();
      }
    }, 100);
  }).catch((error) => {
    // If App import fails due to config error, show ConfigErrorBoundary
    const importError = error instanceof Error ? error : new Error(String(error));
    if (importError.message.includes('Missing required') ||
        importError.message.includes('FATAL') ||
        importError.message.includes('environment variables')) {
      root.render(
        <React.StrictMode>
          <ConfigErrorBoundary error={importError} />
        </React.StrictMode>
      );

      // Signal mounted (config error boundary is a valid mounted state)
      setTimeout(() => {
        if (window.__FLOWBILLS_BOOT__) {
          window.__FLOWBILLS_BOOT__.stage = 'mounted';
          window.__FLOWBILLS_BOOT__.ts = Date.now();
        }
      }, 100);
    } else {
      // Re-throw non-config errors (these will be caught by bootstrap error handler)
      throw error;
    }
  });
}

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
