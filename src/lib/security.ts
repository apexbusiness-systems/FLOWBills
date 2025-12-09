// Frontend Security Utilities
import { toast } from "@/hooks/use-toast";

/**
 * Enhanced input sanitization to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/vbscript:/gi, "") // Remove VBScript protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .replace(/data:/gi, "") // Remove data URIs
    .replace(/\0/g, "") // Remove null bytes
    .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
    .trim();
};

/**
 * Advanced input validation with type checking
 */
export const validateInputAdvanced = (
  input: any,
  options: {
    type?: "string" | "number" | "email" | "uuid";
    maxLength?: number;
    minLength?: number;
    allowedChars?: RegExp;
    required?: boolean;
  } = {}
): { valid: boolean; error?: string; sanitized?: any } => {
  const { type = "string", maxLength, minLength, allowedChars, required = true } = options;

  // Check if required
  if (required && (input === null || input === undefined || input === "")) {
    return { valid: false, error: "Field is required" };
  }

  if (!required && (input === null || input === undefined || input === "")) {
    return { valid: true, sanitized: input };
  }

  // Type validation
  switch (type) {
    case "string":
      if (typeof input !== "string") {
        return { valid: false, error: "Must be a string" };
      }
      const sanitized = sanitizeInput(input);

      if (minLength && sanitized.length < minLength) {
        return { valid: false, error: `Must be at least ${minLength} characters` };
      }
      if (maxLength && sanitized.length > maxLength) {
        return { valid: false, error: `Must be no more than ${maxLength} characters` };
      }
      if (allowedChars && !allowedChars.test(sanitized)) {
        return { valid: false, error: "Contains invalid characters" };
      }

      return { valid: true, sanitized };

    case "number":
      const num = Number(input);
      if (isNaN(num)) {
        return { valid: false, error: "Must be a valid number" };
      }
      return { valid: true, sanitized: num };

    case "email":
      if (typeof input !== "string") {
        return { valid: false, error: "Email must be a string" };
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const sanitizedEmail = sanitizeInput(input);
      if (!emailRegex.test(sanitizedEmail)) {
        return { valid: false, error: "Invalid email format" };
      }
      return { valid: true, sanitized: sanitizedEmail };

    case "uuid":
      if (typeof input !== "string") {
        return { valid: false, error: "UUID must be a string" };
      }
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const sanitizedUuid = sanitizeInput(input);
      if (!uuidRegex.test(sanitizedUuid)) {
        return { valid: false, error: "Invalid UUID format" };
      }
      return { valid: true, sanitized: sanitizedUuid };

    default:
      return { valid: false, error: "Unknown validation type" };
  }
};

/**
 * Validate file uploads on client side
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Max file size: 20MB
  const MAX_SIZE = 20 * 1024 * 1024;

  // Allowed file types for invoices
  const ALLOWED_TYPES = [
    "application/pdf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "application/xml",
    "text/xml",
  ];

  if (file.size > MAX_SIZE) {
    return { valid: false, error: "File size exceeds 20MB limit" };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "File type not supported. Only PDF, Excel, CSV, and XML files allowed.",
    };
  }

  // Check for suspicious file names
  const suspiciousPatterns = [".exe", ".bat", ".cmd", ".scr", ".js", ".vbs"];
  const fileName = file.name.toLowerCase();

  if (suspiciousPatterns.some((pattern) => fileName.includes(pattern))) {
    return { valid: false, error: "Suspicious file type detected" };
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
    const validTimes = actionTimes.filter((time) => now - time < this.windowMs);

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
export const validateFormData = (
  data: Record<string, any>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check for required fields
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === "string") {
      // Sanitize string inputs
      data[key] = sanitizeInput(value);

      // Check for suspicious patterns
      if (value.includes("<script") || value.includes("javascript:")) {
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
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
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
 * Enhanced Content Security Policy for production security
 */
export const CSP_POLICY = {
  "default-src": "'self'",
  "script-src":
    "'self' 'nonce-{NONCE}' https://www.googletagmanager.com https://www.google-analytics.com 'strict-dynamic'",
  "style-src": "'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src": "'self' data: https: blob:",
  "connect-src":
    "'self' https://ullqluvzkgnwwqijhvjr.supabase.co https://api.openai.com https://www.google-analytics.com https://region1.google-analytics.com wss://ullqluvzkgnwwqijhvjr.supabase.co",
  "font-src": "'self' data: https://fonts.gstatic.com",
  "object-src": "'none'",
  "media-src": "'self' blob:",
  "frame-src": "'none'",
  "frame-ancestors": "'none'",
  "base-uri": "'self'",
  "form-action": "'self'",
  "manifest-src": "'self'",
  "worker-src": "'self' blob:",
  "upgrade-insecure-requests": "",
  "block-all-mixed-content": "",
};

/**
 * Additional security headers for comprehensive protection
 */
export const SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
};

/**
 * Generate CSP nonce for runtime script execution
 */
export const generateCSPNonce = (): string => {
  return crypto.randomUUID().replace(/-/g, "");
};

/**
 * Apply CSP nonce to HTML at runtime (for Vite builds)
 */
export const applySPNonce = () => {
  if (typeof window === "undefined") return;

  const nonce = generateCSPNonce();

  // Update CSP meta tag with actual nonce
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (cspMeta) {
    const content = cspMeta.getAttribute("content");
    if (content) {
      cspMeta.setAttribute("content", content.replace("CSP_NONCE_PLACEHOLDER", nonce));
    }
  }

  // Apply nonce to inline scripts
  document.querySelectorAll('script[nonce="CSP_NONCE_PLACEHOLDER"]').forEach((script) => {
    script.setAttribute("nonce", nonce);
  });
};
