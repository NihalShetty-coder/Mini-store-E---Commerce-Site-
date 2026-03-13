/**
 * Simple in-memory rate limiter
 * 
 * WARNING: This implementation is NOT suitable for production with multiple instances.
 * - In-memory store resets on server restart
 * - Each server instance has its own isolated store (no shared state)
 * - Does not work with serverless/containerized deployments
 * 
 * For production, migrate to:
 * - Redis (self-hosted or Redis Cloud)
 * - Upstash (Redis-compatible serverless)
 * - Vercel KV (if on Vercel)
 * - Or a managed rate-limit service like Cloudflare Rate Limiting
 * 
 * Example Upstash integration:
 * import { Redis } from '@upstash/redis';
 * const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: ... });
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 10 * 60 * 1000);

export interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max requests per interval
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Rate limiter function
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns RateLimitResult
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = `${identifier}`;

  if (!store[key] || store[key].resetTime < now) {
    // Initialize or reset
    store[key] = {
      count: 1,
      resetTime: now + config.interval,
    };

    return {
      success: true,
      limit: config.uniqueTokenPerInterval,
      remaining: config.uniqueTokenPerInterval - 1,
      reset: store[key].resetTime,
    };
  }

  // Increment count
  store[key].count += 1;

  const success = store[key].count <= config.uniqueTokenPerInterval;
  const remaining = Math.max(0, config.uniqueTokenPerInterval - store[key].count);

  return {
    success,
    limit: config.uniqueTokenPerInterval,
    remaining,
    reset: store[key].resetTime,
  };
}

/**
 * Get client identifier from request (IP address or fallback)
 */
export function getIdentifier(req: Request): string {
  // Try to get real IP from various headers (works with most proxies/CDNs)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip'); // Cloudflare

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to a generic identifier
  return 'unknown';
}

/**
 * Common rate limit configurations
 */
export const rateLimitConfigs = {
  // Strict: For authentication endpoints (5 requests per 15 minutes)
  auth: {
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 5,
  },
  
  // Moderate: For checkout and order creation (10 per 10 minutes)
  checkout: {
    interval: 10 * 60 * 1000, // 10 minutes
    uniqueTokenPerInterval: 10,
  },
  
  // Relaxed: For general API routes (100 per hour)
  general: {
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 100,
  },
  
  // Very strict: For admin actions (30 per hour)
  admin: {
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 30,
  },
};
