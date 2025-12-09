/**
 * Edge Function Rate Limiting Middleware
 * Enterprise-grade rate limiting with database persistence
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  keyPrefix: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for a given key
 */
export async function checkRateLimit(
  supabaseClient: ReturnType<typeof createClient>,
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const resourceKey = `${config.keyPrefix}:${key}`;
  const windowStart = new Date(Date.now() - config.windowSeconds * 1000);

  try {
    // Get current count in window
    const { data: existing, error: selectError } = await supabaseClient
      .from('rate_limits')
      .select('request_count, window_start')
      .eq('resource_key', resourceKey)
      .gte('window_start', windowStart.toISOString())
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // Error other than "not found"
      console.error('Rate limit check error:', selectError);
      // Fail open - allow request on error
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        reset: Date.now() + config.windowSeconds * 1000,
      };
    }

    const now = new Date();

    if (!existing) {
      // First request in window
      await supabaseClient.from('rate_limits').insert({
        resource_key: resourceKey,
        resource_type: config.keyPrefix,
        request_count: 1,
        window_start: now.toISOString(),
        metadata: { key },
      });

      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        reset: Date.now() + config.windowSeconds * 1000,
      };
    }

    // Check if limit exceeded
    if (existing.request_count >= config.maxRequests) {
      const resetTime = new Date(existing.window_start).getTime() + config.windowSeconds * 1000;

      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: resetTime,
      };
    }

    // Increment counter
    const { error: updateError } = await supabaseClient
      .from('rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('resource_key', resourceKey)
      .eq('window_start', existing.window_start);

    if (updateError) {
      console.error('Rate limit update error:', updateError);
      // Fail open
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - existing.request_count - 1,
        reset: new Date(existing.window_start).getTime() + config.windowSeconds * 1000,
      };
    }

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - existing.request_count - 1,
      reset: new Date(existing.window_start).getTime() + config.windowSeconds * 1000,
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open - allow request on error
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: Date.now() + config.windowSeconds * 1000,
    };
  }
}

/**
 * Rate limit response helper
 */
export function rateLimitResponse(result: RateLimitResult, corsHeaders: Record<string, string>) {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': retryAfter.toString(),
      },
    },
  );
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
  STRICT: { maxRequests: 10, windowSeconds: 60, keyPrefix: 'strict' },
  NORMAL: { maxRequests: 60, windowSeconds: 60, keyPrefix: 'normal' },
  RELAXED: { maxRequests: 300, windowSeconds: 60, keyPrefix: 'relaxed' },
  AUTH: { maxRequests: 5, windowSeconds: 300, keyPrefix: 'auth' },
  LEAD: { maxRequests: 5, windowSeconds: 3600, keyPrefix: 'lead' },
} as const;
