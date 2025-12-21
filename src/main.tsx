// #region agent log
console.log('[DEBUG] main.tsx:1 - Module execution started');
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:1',message:'Module execution started',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion
import React from "react";
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:3',message:'React import completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion
import { createRoot } from "react-dom/client";
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:5',message:'createRoot import completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion
import App from "./App.tsx";
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:7',message:'App component import completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion
import "./index.css";
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:9',message:'CSS import completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:11',message:'About to import i18n config',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion
import "./i18n/config";
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:13',message:'i18n config import completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:15',message:'About to import security',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion
import { applySPNonce } from "./lib/security";
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:17',message:'Security import completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion
import { performanceMonitor } from "./lib/performance-monitor";
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:19',message:'Performance monitor import completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion
import { queryOptimizer } from "./lib/query-optimizer";
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:21',message:'Query optimizer import completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion
import { startPersistenceCleanup } from "./lib/persistence";
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:23',message:'Persistence import completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

// Mark module as loaded immediately
declare global {
  interface Window {
    __FLOWBILLS_LOADED__?: boolean;
  }
}
window.__FLOWBILLS_LOADED__ = true;
console.log('[FlowBills] Module loaded');
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:35',message:'Module loaded flag set',data:{moduleLoaded:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('[FlowBills] Uncaught error:', event.message, event.filename, event.lineno);
  // #region agent log
  fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:40',message:'Uncaught error detected',data:{message:event.message,filename:event.filename,lineno:event.lineno,error:event.error?.toString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[FlowBills] Unhandled rejection:', event.reason);
  // #region agent log
  fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:46',message:'Unhandled rejection detected',data:{reason:event.reason?.toString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
});

// Apply CSP nonce at runtime
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:52',message:'About to apply CSP nonce',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion
try {
  applySPNonce();
  // #region agent log
  fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:56',message:'CSP nonce applied successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
} catch (error) {
  // #region agent log
  fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:59',message:'CSP nonce application failed',data:{error:error?.toString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
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
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:75',message:'About to get root element',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
// #endregion
const rootElement = document.getElementById("root");
if (!rootElement) {
  // #region agent log
  fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:78',message:'Root element not found',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  throw new Error("Root element not found");
}

// CRITICAL FIX: Clear root element completely before React render
// This prevents React error #418 which occurs when React tries to hydrate existing content
console.log('[DEBUG] main.tsx:85 - Clearing root element before React render');
rootElement.innerHTML = '';
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:82',message:'Root element found and cleared',data:{rootExists:!!rootElement,rootContent:rootElement.innerHTML.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
// #endregion

// Render the app
console.log('[FlowBills] Starting React render');
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:86',message:'About to create React root',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
// #endregion
try {
  console.log('[DEBUG] main.tsx:130 - Creating React root, rootElement type:', rootElement.constructor.name);
  console.log('[DEBUG] main.tsx:131 - Root element is:', rootElement);
  console.log('[DEBUG] main.tsx:132 - createRoot function:', typeof createRoot);
  
  const root = createRoot(rootElement);
  console.log('[DEBUG] main.tsx:135 - React root created successfully');
  // #region agent log
  fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:90',message:'React root created',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  // Verify App is a valid React component
  console.log('[DEBUG] main.tsx:139 - App component type:', typeof App);
  console.log('[DEBUG] main.tsx:140 - App is function:', typeof App === 'function');
  
  // #region agent log
  fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:92',message:'About to render App component',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  console.log('[DEBUG] main.tsx:145 - About to call root.render(<App />)');
  console.log('[DEBUG] main.tsx:146 - Root element before render (should be empty):', rootElement.innerHTML);
  
  // CRITICAL FIX: Use JSX directly (same as React.createElement but more reliable)
  // The issue might be that we need to ensure React is fully initialized
  if (!React || typeof React.createElement !== 'function') {
    throw new Error('React is not properly initialized');
  }
  
  console.log('[DEBUG] main.tsx:151 - React is valid, rendering App component');
  root.render(<App />);
  console.log('[DEBUG] main.tsx:153 - root.render() completed without throwing');
  // #region agent log
  fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:94',message:'App component render called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  // Check if React actually rendered after a short delay
  setTimeout(() => {
    const rootCheck = document.getElementById('root');
    const contentLength = rootCheck?.innerHTML.trim().length || 0;
    console.log('[DEBUG] main.tsx:145 - Post-render check:', { contentLength, hasContent: contentLength > 0 });
    if (contentLength === 0) {
      console.error('[DEBUG] main.tsx:147 - WARNING: React render called but root element is still empty!');
    }
  }, 500);
} catch (error) {
  console.error('[DEBUG] main.tsx:150 - React render FAILED:', error);
  // #region agent log
  fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:97',message:'React render failed',data:{error:error?.toString(),stack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  throw error;
}

// Remove loader after React renders - simple approach
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    const loader = document.getElementById('flowbills-loader');
    const root = document.getElementById('root');
    const rootContent = root?.innerHTML.trim().length || 0;
    // #region agent log
    fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:105',message:'Checking render result',data:{loaderExists:!!loader,rootContentLength:rootContent},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (loader) {
      console.log('[FlowBills] App rendered, removing loader');
      loader.remove();
      // #region agent log
      fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:109',message:'Loader removed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    }
  });
});
