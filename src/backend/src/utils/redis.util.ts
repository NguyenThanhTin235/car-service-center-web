import Redis from 'ioredis';

// In-memory fallback cache when Redis is disconnected or unavailable
const memoryCache = new Map<string, { value: string; expiresAt: number }>();

const isMemoryExpired = (entry: { value: string; expiresAt: number }): boolean => {
  return Date.now() > entry.expiresAt;
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
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });

  if (isRedisReady || redisClient.status === 'ready') {
    try {
      await redisClient.set(key, value, 'EX', ttlSeconds);
    } catch (err) {
      console.warn(`[Redis] setCache failed for key ${key}, falling back to memory:`, (err as Error).message);
    }
  }
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

export default redisClient;
