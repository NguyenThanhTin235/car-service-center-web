import prisma from '../utils/prisma';
import redisClient from '../utils/redis.util';

export type CheckState = 'up' | 'down' | 'degraded';

export interface HealthReport {
  status: 'ok' | 'degraded' | 'unhealthy';
  version: string;
  uptimeSeconds: number;
  checks: {
    database: 'up' | 'down';
    redis: CheckState;
  };
}

export interface HealthCheckResult {
  httpStatus: 200 | 503;
  report: HealthReport;
}

export interface HealthDependencies {
  checkDb?: () => Promise<unknown>;
  checkRedis?: () => Promise<string>;
}

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} health check timed out`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

export const checkHealth = async (deps?: HealthDependencies): Promise<HealthCheckResult> => {
  const probeDb = deps?.checkDb ?? (() => prisma.$queryRaw`SELECT 1`);
  const probeRedis =
    deps?.checkRedis ??
    (async () => {
      if (redisClient.status !== 'ready') {
        throw new Error(`Redis status is ${redisClient.status}`);
      }
      return redisClient.ping();
    });

  let dbState: 'up' | 'down' = 'up';
  let redisState: CheckState = 'up';

  try {
    await withTimeout(probeDb(), 2000, 'Database');
  } catch {
    dbState = 'down';
  }

  try {
    const pong = await withTimeout(probeRedis(), 1500, 'Redis');
    if (pong !== 'PONG') {
      redisState = 'degraded';
    }
  } catch {
    // Redis utility automatically falls back to in-memory cache when Redis is unavailable
    redisState = 'degraded';
  }

  const status: HealthReport['status'] =
    dbState === 'down' ? 'unhealthy' : redisState === 'up' ? 'ok' : 'degraded';

  return {
    httpStatus: dbState === 'down' ? 503 : 200,
    report: {
      status,
      version: process.env.APP_VERSION || '1.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      checks: {
        database: dbState,
        redis: redisState,
      },
    },
  };
};
