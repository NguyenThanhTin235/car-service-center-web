import Redis from 'ioredis';

// In-memory fallback cache when Redis is disconnected or unavailable (bounded FIFO)
const MAX_MEMORY_CACHE_ENTRIES = 5000;
const memoryCache = new Map<string, { value: string; expiresAt: number }>();
// Isolated rate-limit fallback store so high-cardinality IP/rate-limit keys never evict catalog/auth caches
const MAX_RATE_LIMIT_MEMORY_ENTRIES = 5000;
const rateLimitMemory = new Map<string, { count: number; expiresAt: number }>();

const isMemoryExpired = (entry: { value: string; expiresAt: number }): boolean => {
  return Date.now() > entry.expiresAt;
};

const setMemoryEntry = (key: string, value: string, ttlSeconds: number) => {
  if (memoryCache.has(key)) {
    memoryCache.delete(key);
  } else if (memoryCache.size >= MAX_MEMORY_CACHE_ENTRIES) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey !== undefined) memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
};

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 1,
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy(times) {
    if (times > 5) return 5000;
    return Math.min(times * 500, 3000);
  },
});

let isRedisReady = false;

redisClient.on('error', () => {
  isRedisReady = false;
});

redisClient.on('connect', () => {
  isRedisReady = true;
  console.log('[Redis] Connected successfully');
});

redisClient.on('ready', () => {
  isRedisReady = true;
});

redisClient.on('close', () => {
  isRedisReady = false;
});

export const connectRedis = async (): Promise<void> => {
  try {
    if (redisClient.status !== 'ready' && redisClient.status !== 'connecting') {
      await redisClient.connect();
    }
  } catch (err) {
    console.warn('[Redis] Connect failed, using in-memory fallback cache.');
  }
};

/**
 * Store a value in Redis with TTL (in seconds), with in-memory fallback
 */
export const setCache = async (key: string, value: string, ttlSeconds: number): Promise<void> => {
  // Always update memory fallback so data is never lost
  setMemoryEntry(key, value, ttlSeconds);

  if (isRedisReady || redisClient.status === 'ready') {
    try {
      await redisClient.set(key, value, 'EX', ttlSeconds);
    } catch (err) {
      console.warn(`[Redis] setCache failed for key ${key}, falling back to memory:`, (err as Error).message);
    }
  }
};

/**
 * Retrieve multiple values from Redis in a single roundtrip, with in-memory fallback
 */
export const mgetCache = async (keys: string[]): Promise<(string | null)[]> => {
  if (keys.length === 0) return [];

  if (isRedisReady || redisClient.status === 'ready') {
    try {
      const vals = await redisClient.mget(...keys);
      return vals.map((val, idx) => {
        if (val !== null) return val;
        const mem = memoryCache.get(keys[idx]);
        if (!mem) return null;
        if (isMemoryExpired(mem)) {
          memoryCache.delete(keys[idx]);
          return null;
        }
        return mem.value;
      });
    } catch (err) {
      console.warn('[Redis] mgetCache failed, falling back to memory:', (err as Error).message);
    }
  }

  return keys.map((key) => {
    const mem = memoryCache.get(key);
    if (!mem) return null;
    if (isMemoryExpired(mem)) {
      memoryCache.delete(key);
      return null;
    }
    return mem.value;
  });
};

/**
 * Retrieve a value from Redis, with in-memory fallback
 */
export const getCache = async (key: string): Promise<string | null> => {
  if (isRedisReady || redisClient.status === 'ready') {
    try {
      const val = await redisClient.get(key);
      if (val !== null) return val;
    } catch (err) {
      console.warn(`[Redis] getCache failed for key ${key}, falling back to memory:`, (err as Error).message);
    }
  }

  const memoryEntry = memoryCache.get(key);
  if (memoryEntry) {
    if (isMemoryExpired(memoryEntry)) {
      memoryCache.delete(key);
      return null;
    }
    return memoryEntry.value;
  }

  return null;
};

/**
 * Delete a key from Redis and memory cache
 */
export const deleteCache = async (key: string): Promise<void> => {
  memoryCache.delete(key);
  if (isRedisReady || redisClient.status === 'ready') {
    try {
      await redisClient.del(key);
    } catch (err) {
      // Ignore del error
    }
  }
};

/**
 * Delete all keys matching a prefix from memory cache and Redis (via SCAN)
 */
export const deleteCacheByPrefix = async (prefix: string): Promise<void> => {
  for (const key of Array.from(memoryCache.keys())) {
    if (key.startsWith(prefix)) memoryCache.delete(key);
  }
  if (isRedisReady || redisClient.status === 'ready') {
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } while (cursor !== '0');
    } catch {
      // Ignore scan/del error
    }
  }
};

/**
 * Atomic fixed-window counter increment using Redis MULTI (INCR + TTL),
 * falling back to synchronous in-memory Map when Redis is unavailable.
 */
export const incrRateLimitWindow = async (
  key: string,
  windowSeconds: number
): Promise<{ count: number; ttlSeconds: number }> => {
  if (isRedisReady || redisClient.status === 'ready') {
    try {
      const results = await redisClient.multi().incr(key).ttl(key).exec();
      const count = Number(results?.[0]?.[1] ?? 1);
      let ttl = Number(results?.[1]?.[1] ?? -1);
      if (ttl < 0) {
        await redisClient.expire(key, windowSeconds);
        ttl = windowSeconds;
      }
      return { count, ttlSeconds: Math.max(1, ttl) };
    } catch (err) {
      console.warn(`[Redis] incrRateLimitWindow failed for ${key}, using memory:`, (err as Error).message);
    }
  }

  const now = Date.now();
  const existing = rateLimitMemory.get(key);
  let entry: { count: number; expiresAt: number };

  if (existing && existing.expiresAt > now) {
    entry = { count: existing.count + 1, expiresAt: existing.expiresAt };
  } else {
    if (!existing && rateLimitMemory.size >= MAX_RATE_LIMIT_MEMORY_ENTRIES) {
      const oldestKey = rateLimitMemory.keys().next().value;
      if (oldestKey !== undefined) rateLimitMemory.delete(oldestKey);
    }
    entry = { count: 1, expiresAt: now + windowSeconds * 1000 };
  }

  rateLimitMemory.set(key, entry);
  return {
    count: entry.count,
    ttlSeconds: Math.max(1, Math.ceil((entry.expiresAt - now) / 1000)),
  };
};

export default redisClient;
