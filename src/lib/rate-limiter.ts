/**
 * Enterprise Rate Limiting Utility
 * Implements sliding window rate limiting with Redis-like behavior
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

class RateLimiter {
  private storage: Map<string, { count: number; windowStart: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if request is allowed under rate limit
   */
  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;

    const entry = this.storage.get(fullKey);

    // New window or expired window
    if (!entry || now - entry.windowStart >= config.windowMs) {
      this.storage.set(fullKey, {
        count: 1,
        windowStart: now,
      });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: new Date(now + config.windowMs),
      };
    }

    // Within window - check limit
    if (entry.count >= config.maxRequests) {
      const resetAt = new Date(entry.windowStart + config.windowMs);
      const retryAfter = Math.ceil((entry.windowStart + config.windowMs - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter,
      };
    }

    // Increment counter
    entry.count++;
    this.storage.set(fullKey, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: new Date(entry.windowStart + config.windowMs),
    };
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string, keyPrefix?: string): void {
    const fullKey = keyPrefix ? `${keyPrefix}:${key}` : key;
    this.storage.delete(fullKey);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.storage.entries()) {
      // Remove entries older than 1 hour
      if (now - entry.windowStart > 3600000) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => this.storage.delete(key));
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.storage.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Predefined rate limit configurations
export const RateLimitPresets = {
  // API endpoints
  API_STRICT: { maxRequests: 10, windowMs: 60000 }, // 10 req/min
  API_NORMAL: { maxRequests: 60, windowMs: 60000 }, // 60 req/min
  API_RELAXED: { maxRequests: 300, windowMs: 60000 }, // 300 req/min

  // Authentication
  AUTH_LOGIN: { maxRequests: 5, windowMs: 300000 }, // 5 attempts per 5 min
  AUTH_SIGNUP: { maxRequests: 3, windowMs: 3600000 }, // 3 per hour

  // Data operations
  DATA_WRITE: { maxRequests: 30, windowMs: 60000 }, // 30 writes/min
  DATA_READ: { maxRequests: 120, windowMs: 60000 }, // 120 reads/min

  // Lead submissions
  LEAD_SUBMIT: { maxRequests: 5, windowMs: 3600000 }, // 5 per hour

  // File uploads
  FILE_UPLOAD: { maxRequests: 10, windowMs: 300000 }, // 10 per 5 min
} as const;

/**
 * React hook for client-side rate limiting
 */
export function useRateLimit(key: string, config: RateLimitConfig) {
  const checkLimit = async (): Promise<RateLimitResult> => {
    return rateLimiter.check(key, config);
  };

  const resetLimit = () => {
    rateLimiter.reset(key, config.keyPrefix);
  };

  return { checkLimit, resetLimit };
}

/**
 * Express-style middleware for rate limiting
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async (req: any, res: any, next: any) => {
    const key = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const result = await rateLimiter.check(key, config);

    // Add rate limit headers
    res.setHeader("X-RateLimit-Limit", config.maxRequests);
    res.setHeader("X-RateLimit-Remaining", result.remaining);
    res.setHeader("X-RateLimit-Reset", result.resetAt.toISOString());

    if (!result.allowed) {
      res.setHeader("Retry-After", result.retryAfter || 60);
      return res.status(429).json({
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: result.retryAfter,
      });
    }

    next();
  };
}

export default rateLimiter;
