import { loadEnvConfig } from "@next/env";
import { Redis } from "@upstash/redis";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

let redis: Redis | null | undefined;

export function getRedis() {
  if (redis !== undefined) return redis;

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = null;
    return redis;
  }

  redis = Redis.fromEnv();
  return redis;
}
