import { LRUCache } from 'lru-cache';

interface RateLimitTracker {
  count: number;
}

const tokenCache = new LRUCache<string, RateLimitTracker>({
  max: 500, // Handle up to 500 unique IPs at once
  ttl: 15 * 60 * 1000, // 15 minute sliding window
});

export async function rateLimit(ip: string, limit: number = 5): Promise<boolean> {
  const tokenCount = tokenCache.get(ip)?.count || 0;
  
  if (tokenCount >= limit) {
    return false; // Rate limited
  }

  tokenCache.set(ip, { count: tokenCount + 1 });
  return true; // Allowed
}
