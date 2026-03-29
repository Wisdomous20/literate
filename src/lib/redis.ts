import Redis from "ioredis";

let redis: Redis | undefined;

export function getRedis(): Redis {
  if (redis) return redis;

  const url = process.env.REDIS_URL || "redis://localhost:6379";

  redis = new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 5000);
      console.log(`[Redis] Reconnecting in ${delay}ms (attempt ${times})`);
      return delay;
    },
  });

  redis.on("connect", () => console.log("[Redis] Connected"));
  redis.on("error", (err) => console.error("[Redis] Error:", err.message));

  return redis;
}