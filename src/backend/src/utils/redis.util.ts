import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  console.error('[Redis] Connection error:', err);
});

redisClient.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

export const connectRedis = async (): Promise<void> => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

/**
 * Store a value in Redis with TTL (in seconds)
 */
export const setCache = async (key: string, value: string, ttlSeconds: number): Promise<void> => {
  await redisClient.set(key, value, { EX: ttlSeconds });
};

/**
 * Retrieve a value from Redis
 */
export const getCache = async (key: string): Promise<string | null> => {
  return redisClient.get(key);
};

/**
 * Delete a key from Redis
 */
export const deleteCache = async (key: string): Promise<void> => {
  await redisClient.del(key);
};

export default redisClient;
