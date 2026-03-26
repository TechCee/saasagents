import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const memoryFallback = new Map<string, number>();

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = getRedis();

const limiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1, "30 m"),
      prefix: "cc:agent",
    })
  : null;

/**
 * Max 1 run per agent type per organisation per 30 minutes (per architecture v5.1).
 */
export async function allowAgentRun(orgId: string, agentType: string) {
  const key = `${orgId}:${agentType}`;
  if (limiter) {
    const { success } = await limiter.limit(key);
    return success;
  }
  const now = Date.now();
  const windowMs = 30 * 60 * 1000;
  const last = memoryFallback.get(key) ?? 0;
  if (now - last < windowMs) return false;
  memoryFallback.set(key, now);
  return true;
}
