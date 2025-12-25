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

// Enhanced global error handlers with better logging
window.addEventListener('error', (event) => {
  const errorDetails = {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  };
  
  console.error('[FlowBills] Uncaught error:', errorDetails);
  
  // In development, show more details
  if (import.meta.env.DEV) {
    console.error('Full error object:', event.error);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const rejectionDetails = {
    reason: event.reason,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  };
  
  console.error('[FlowBills] Unhandled promise rejection:', rejectionDetails);
  
  // In development, show stack trace if available
  if (import.meta.env.DEV && event.reason instanceof Error) {
    console.error('Rejection stack:', event.reason.stack);
  }
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
} else {
  // Dynamically import App to avoid loading it if config is invalid
  import('./App.tsx').then(({ default: App }) => {
    root.render(<App />);
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
    } else {
      // Re-throw non-config errors
      throw error;
    }
  });
}

// Remove loader after React renders - simple approach
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    const loader = document.getElementById('flowbills-loader');
    if (loader) {
      loader.remove();
    }
  });
});