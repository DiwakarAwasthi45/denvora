import { ApiError } from "./api";

interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * In-memory sliding window rate limiter.
 * Suitable for single-instance deployments (Vercel functions / one Node process).
 * Swap for Redis-backed limiter when horizontal scaling is required.
 */
const store = new Map<string, Bucket>();

function prune(): void {
  const now = Date.now();
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
  if (store.size > 10_000) store.clear();
}

export function rateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const { key, limit, windowMs } = opts;
  const now = Date.now();
  prune();

  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.max(bucket.resetAt - now, 0),
    };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfterMs: 0 };
}

export function assertRateLimit(opts: { key: string; limit: number; windowMs: number }): void {
  const result = rateLimit(opts);
  if (!result.ok) {
    throw ApiError.rateLimited(`Too many requests. Please retry in ${Math.ceil(result.retryAfterMs / 1000)}s.`);
  }
}
