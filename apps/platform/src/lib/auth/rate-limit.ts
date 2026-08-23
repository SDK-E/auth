import { getRedis } from "@/lib/redis";

export type RateLimitResult =
  | { ok: true; count: number }
  | { ok: false; count: number; retryAfterSec: number };

export function requestClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function enforceRateLimit(
  scope: string,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const redis = getRedis();
  if (!redis) return { ok: true, count: 0 };
  const bucket = `rl:${scope}:${key}`;
  try {
    const count = await redis.incr(bucket);
    if (count === 1) {
      await redis.expire(bucket, windowSeconds);
    }
    if (count > limit) {
      const ttl = await redis.ttl(bucket);
      return { ok: false, count, retryAfterSec: ttl >= 0 ? ttl : windowSeconds };
    }
    return { ok: true, count };
  } catch (error) {
    console.error("rate_limiter_unavailable_failing_open", {
      scope,
      error: error instanceof Error ? error.message : "unknown",
    });
    return { ok: true, count: 0 };
  }
}

export async function resetRateLimit(scope: string, key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(`rl:${scope}:${key}`);
  } catch (error) {
    console.error("rate_limit_reset_failed", {
      scope,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}
