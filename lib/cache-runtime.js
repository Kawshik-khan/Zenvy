const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const CACHE_PREFIX = "zenvy";

function studyMetricsKey(userId) {
  return `${CACHE_PREFIX}:study-metrics:v1:user:${userId}`;
}

function conversationUnreadKey(userId) {
  return `${CACHE_PREFIX}:conversation-unread:v1:user:${userId}`;
}

async function deleteCacheKeys(keys) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const uniqueKeys = Array.from(new Set(keys.filter(Boolean)));

  if (!url || !token || uniqueKeys.length === 0 || typeof fetch !== "function") return;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["DEL", ...uniqueKeys]),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Upstash DEL failed: ${response.status} ${response.statusText}${body ? ` ${body}` : ""}`);
    }
  } catch (error) {
    console.warn("Redis cache delete failed:", error);
  }
}

async function invalidateStudyMetrics(...userIds) {
  await deleteCacheKeys(userIds.filter(Boolean).map(studyMetricsKey));
}

async function invalidateConversationUnread(...userIds) {
  await deleteCacheKeys(userIds.filter(Boolean).map(conversationUnreadKey));
}

module.exports = {
  invalidateConversationUnread,
  invalidateStudyMetrics,
};
