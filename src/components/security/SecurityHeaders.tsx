import { useEffect } from 'react';

// Enhanced CSP Policy with stricter security
const CSP_POLICY = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Vite in development
    'https://unpkg.com',
    'https://cdn.jsdelivr.net'
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind
    'https://fonts.googleapis.com'
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com'
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:'
  ],
  'connect-src': [
    "'self'",
    'https://yvyjzlbosmtesldczhnm.supabase.co',
    'wss://yvyjzlbosmtesldczhnm.supabase.co'
  ],
  'frame-ancestors': ["'none'"],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
  'media-src': ["'self'"],
  'worker-src': ["'self'"],
  'child-src': ["'none'"],
  'frame-src': ["'none'"],
  'manifest-src': ["'self'"]
};

// Generate a random nonce for CSP
const generateCSPNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
};

// Convert CSP policy object to string
const generateCSPString = (policy: typeof CSP_POLICY): string => {
  return Object.entries(policy)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};

// Comprehensive security headers
const SECURITY_HEADERS = {
  'Content-Security-Policy': generateCSPString(CSP_POLICY),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
};

export const SecurityHeaders = () => {
  useEffect(() => {
    // Apply security headers as meta tags (limited effectiveness)
    Object.entries(SECURITY_HEADERS).forEach(([name, content]) => {
      const existingMeta = document.querySelector(`meta[http-equiv="${name}"]`);
      if (!existingMeta) {
        const meta = document.createElement('meta');
        meta.httpEquiv = name;
        meta.content = content;
        document.head.appendChild(meta);
      }
    });

    // Set up CSP violation monitoring
    const handleCSPViolation = (event: SecurityPolicyViolationEvent) => {
      console.warn('CSP Violation:', {
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy,
        disposition: event.disposition
      });

      // Send violation report to logging endpoint
      if ('sendBeacon' in navigator) {
        const violationData = {
          blocked_uri: event.blockedURI,
          violated_directive: event.violatedDirective,
          original_policy: event.originalPolicy,
          disposition: event.disposition,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          document_uri: window.location.href
        };

        try {
          navigator.sendBeacon('/api/csp-violation', JSON.stringify(violationData));
        } catch (error) {
          console.error('Failed to send CSP violation report:', error);
        }
      }
    };

    // Listen for CSP violations
    document.addEventListener('securitypolicyviolation', handleCSPViolation);

    // Set up additional security monitoring
    const securityObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // Check for potentially dangerous script insertions
              if (element.tagName === 'SCRIPT' && !element.hasAttribute('nonce')) {
                console.warn('Potentially dangerous script insertion detected:', element);
              }
              
              // Check for iframe insertions
              if (element.tagName === 'IFRAME') {
                console.warn('Iframe insertion detected:', element);
              }
            }
          });
        }
      });
    });

    // Start observing DOM changes
    securityObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Set security-focused viewport
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no');
    }

    // Disable right-click context menu in production
    const handleContextMenu = (e: Event) => {
      if (import.meta.env.PROD) {
        e.preventDefault();
      }
    };

    // Disable certain key combinations in production
    const handleKeyDown = (e: KeyboardEvent) => {
      if (import.meta.env.PROD) {
        // Disable F12, Ctrl+Shift+I, Ctrl+U, Ctrl+Shift+C
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.key === 'u') ||
          (e.ctrlKey && e.shiftKey && e.key === 'C')
        ) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('securitypolicyviolation', handleCSPViolation);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      securityObserver.disconnect();
    };
  }, []);

  return null; // This component doesn't render anything
};

export { generateCSPNonce, CSP_POLICY };