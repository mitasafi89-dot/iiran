// ============================================================================
// RATE LIMITER — In-memory sliding window rate limiter
// WARNING: This implementation is NOT suitable for production deployments
// on serverless platforms (Vercel, AWS Lambda) or multi-instance setups.
// Each instance maintains its own counter, so rate limits are NOT shared.
// For production: replace with Redis-backed implementation (e.g., @upstash/ratelimit)
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 60s to prevent memory leak
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Max requests in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given key (usually IP + endpoint).
 * Returns whether the request is allowed and remaining quota.
 */
export function rateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetAt: now + config.windowMs,
    };
  }

  entry.count++;

  if (entry.count > config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

// ── Preset configurations ─────────────────────────────────────────────────

/** Strict limit for payment/checkout endpoints: 10 req / 60s per IP */
export const CHECKOUT_LIMIT: RateLimitConfig = {
  limit: 10,
  windowMs: 60_000,
};

/** Standard API limit: 30 req / 60s per IP */
export const API_LIMIT: RateLimitConfig = {
  limit: 30,
  windowMs: 60_000,
};

/** Webhook limit: 100 req / 60s */
export const WEBHOOK_LIMIT: RateLimitConfig = {
  limit: 100,
  windowMs: 60_000,
};
