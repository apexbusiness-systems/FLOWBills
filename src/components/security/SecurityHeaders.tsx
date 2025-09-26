import { useEffect } from 'react';

// Enhanced Content Security Policy
const CSP_POLICY = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Vite dev
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "'nonce-" + generateCSPNonce() + "'"
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind
    "https://fonts.googleapis.com"
  ],
  'font-src': [
    "'self'",
    "https://fonts.gstatic.com"
  ],
  'img-src': [
    "'self'",
    "data:",
    "https:",
    "blob:"
  ],
  'connect-src': [
    "'self'",
    "https://yvyjzlbosmtesldczhnm.supabase.co",
    "https://api.openai.com",
    "https://www.google-analytics.com"
  ],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
  'worker-src': ["'self'", "blob:"],
  'manifest-src': ["'self'"],
  'form-action': ["'self'"]
};

function generateCSPNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function generateCSPString(policy: Record<string, string[]>): string {
  return Object.entries(policy)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

export const SecurityHeaders = () => {
  useEffect(() => {
    // Apply security headers via meta tags (limited effectiveness but better than nothing)
    const securityHeaders = [
      // Content Security Policy
      {
        httpEquiv: 'Content-Security-Policy',
        content: generateCSPString(CSP_POLICY)
      },
      // X-Frame-Options
      {
        httpEquiv: 'X-Frame-Options',
        content: 'DENY'
      },
      // X-Content-Type-Options
      {
        httpEquiv: 'X-Content-Type-Options',
        content: 'nosniff'
      },
      // Referrer Policy
      {
        name: 'referrer',
        content: 'strict-origin-when-cross-origin'
      },
      // Permissions Policy
      {
        httpEquiv: 'Permissions-Policy',
        content: 'camera=(), microphone=(), geolocation=()'
      }
    ];

    // Apply headers as meta tags
    securityHeaders.forEach(header => {
      const existingMeta = document.querySelector(
        `meta[${header.httpEquiv ? 'http-equiv' : 'name'}="${header.httpEquiv || header.name}"]`
      );
      
      if (!existingMeta) {
        const meta = document.createElement('meta');
        if (header.httpEquiv) {
          meta.httpEquiv = header.httpEquiv;
        } else if (header.name) {
          meta.name = header.name;
        }
        meta.content = header.content;
        document.head.appendChild(meta);
      }
    });

    // Security event logging for CSP violations
    const handleCSPViolation = (event: SecurityPolicyViolationEvent) => {
      console.warn('CSP Violation:', {
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy
      });
      
      // Log to security events if available
      if (window.navigator.sendBeacon) {
        const data = JSON.stringify({
          event_type: 'csp_violation',
          severity: 'medium',
          details: {
            blocked_uri: event.blockedURI,
            violated_directive: event.violatedDirective,
            source_file: event.sourceFile,
            line_number: event.lineNumber
          }
        });
        
        // This would need to be sent to your logging endpoint
        // window.navigator.sendBeacon('/api/security/log', data);
      }
    };

    document.addEventListener('securitypolicyviolation', handleCSPViolation);

    return () => {
      document.removeEventListener('securitypolicyviolation', handleCSPViolation);
    };
  }, []);

  return null; // This component doesn't render anything
};

// Export for use in other security components
export { generateCSPNonce, CSP_POLICY };