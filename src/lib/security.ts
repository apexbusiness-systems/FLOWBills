// Frontend Security Utilities
import { toast } from "@/hooks/use-toast";

/**
 * Input sanitization to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validate file uploads on client side
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Max file size: 20MB
  const MAX_SIZE = 20 * 1024 * 1024;
  
  // Allowed file types for invoices
  const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/xml',
    'text/xml'
  ];

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File size exceeds 20MB limit' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not supported. Only PDF, Excel, CSV, and XML files allowed.' };
  }

  // Check for suspicious file names
  const suspiciousPatterns = ['.exe', '.bat', '.cmd', '.scr', '.js', '.vbs'];
  const fileName = file.name.toLowerCase();
  
  if (suspiciousPatterns.some(pattern => fileName.includes(pattern))) {
    return { valid: false, error: 'Suspicious file type detected' };
  }

  return { valid: true };
};

/**
 * Rate limiting for client-side actions
 */
class RateLimiter {
  private actions: Map<string, number[]> = new Map();
  private readonly windowMs: number = 60000; // 1 minute
  
  canPerform(action: string, limit: number): boolean {
    const now = Date.now();
    const actionTimes = this.actions.get(action) || [];
    
    // Remove expired entries
    const validTimes = actionTimes.filter(time => now - time < this.windowMs);
    
    if (validTimes.length >= limit) {
      return false;
    }
    
    validTimes.push(now);
    this.actions.set(action, validTimes);
    return true;
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Secure form data validation
 */
export const validateFormData = (data: Record<string, any>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check for required fields
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      // Sanitize string inputs
      data[key] = sanitizeInput(value);
      
      // Check for suspicious patterns
      if (value.includes('<script') || value.includes('javascript:')) {
        errors.push(`Suspicious content detected in ${key}`);
      }
    }
  });
  
  return { valid: errors.length === 0, errors };
};

/**
 * Generate secure tokens for client-side use
 */
export const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Log security events (would integrate with backend in production)
 */
export const logSecurityEvent = (event: string, details: any) => {
  console.warn(`SECURITY EVENT: ${event}`, details);
  
  // In production, this would send to backend security monitoring
  toast({
    title: "Security Alert",
    description: `Security event logged: ${event}`,
    variant: "destructive",
  });
};

/**
 * Content Security Policy headers (strict policy for production)
 */
export const CSP_POLICY = {
  "default-src": "'self'",
  "script-src": "'self' 'nonce-{NONCE}' https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src": "'self' 'unsafe-inline'",
  "img-src": "'self' data: https:",
  "connect-src": "'self' https://*.supabase.co https://www.google-analytics.com https://region1.google-analytics.com",
  "font-src": "'self' data:",
  "object-src": "'none'",
  "media-src": "'self'",
  "frame-src": "'none'",
  "frame-ancestors": "'none'",
  "base-uri": "'self'",
  "upgrade-insecure-requests": ""
};

/**
 * Generate CSP nonce for runtime script execution
 */
export const generateCSPNonce = (): string => {
  return crypto.randomUUID().replace(/-/g, '');
};

/**
 * Apply CSP nonce to HTML at runtime (for Vite builds)
 */
export const applySPNonce = () => {
  if (typeof window === 'undefined') return;
  
  const nonce = generateCSPNonce();
  
  // Update CSP meta tag with actual nonce
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (cspMeta) {
    const content = cspMeta.getAttribute('content');
    if (content) {
      cspMeta.setAttribute('content', content.replace('CSP_NONCE_PLACEHOLDER', nonce));
    }
  }
  
  // Apply nonce to inline scripts
  document.querySelectorAll('script[nonce="CSP_NONCE_PLACEHOLDER"]').forEach(script => {
    script.setAttribute('nonce', nonce);
  });
};