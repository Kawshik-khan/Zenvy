import { getRedis } from "@/lib/redis";

const CACHE_PREFIX = "zenvy";

export const cacheKeys = {
  studyMetrics: (userId: string) => `${CACHE_PREFIX}:study-metrics:v1:user:${userId}`,
  conversationUnread: (userId: string) => `${CACHE_PREFIX}:conversation-unread:v1:user:${userId}`,
};

export async function getJsonCache<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    return await redis.get<T>(key);
  } catch (error) {
    console.warn("Redis cache read failed:", error);
    return null;
  }
}

export async function setJsonCache<T>(key: string, value: T, ttlSeconds: number) {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.warn("Redis cache write failed:", error);
  }
}

export async function deleteCache(...keys: string[]) {
  const redis = getRedis();
  if (!redis || keys.length === 0) return;

  try {
    await redis.del(...keys);
  } catch (error) {
    console.warn("Redis cache delete failed:", error);
  }
}

export async function invalidateStudyMetrics(...userIds: Array<string | null | undefined>) {
  const keys = Array.from(new Set(userIds.filter(Boolean).map((userId) => cacheKeys.studyMetrics(userId!))));
  await deleteCache(...keys);
}

export async function invalidateConversationUnread(...userIds: Array<string | null | undefined>) {
  const keys = Array.from(new Set(userIds.filter(Boolean).map((userId) => cacheKeys.conversationUnread(userId!))));
  await deleteCache(...keys);
}
