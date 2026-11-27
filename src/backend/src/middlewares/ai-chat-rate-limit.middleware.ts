import { Request, Response, NextFunction } from 'express';
import * as redisUtil from '../utils/redis.util';
import logger from '../loggers/logger';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export interface AiRateLimiterOptions {
  prefix: string;
  windowSeconds: number;
  guestMax: number;
  authMax: number;
  errorCode?: string;
  message?: string;
}

// Per-key serialized mutex used only when unit-test mocks omit atomic incrRateLimitWindow
const fallbackKeyLocks = new Map<string, Promise<void>>();

function runSerialized<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = fallbackKeyLocks.get(key) || Promise.resolve();
  let release!: () => void;
  const nextLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chained = prev.then(() => nextLock);
  fallbackKeyLocks.set(key, chained);

  return prev.then(async () => {
    try {
      return await fn();
    } finally {
      release();
      if (fallbackKeyLocks.get(key) === chained) {
        fallbackKeyLocks.delete(key);
      }
    }
  });
}

function getClientIp(req: Request): string {
  // In real Express HTTP pipeline, req.ip respects bounded `trust proxy` hops (preventing XFF spoofing).
  // In direct unit tests without req.app, fall back cleanly to x-forwarded-for or socket remoteAddress.
  if (Boolean((req as { app?: unknown }).app) && req.ip) {
    return String(req.ip).slice(0, 64);
  }
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
    const firstValidIp = forwarded
      .split(',')
      .map((part) => part.trim())
      .find((part) => part.length > 0);
    if (firstValidIp) return firstValidIp.slice(0, 64);
  }
  return String(req.ip || req.socket?.remoteAddress || 'unknown').slice(0, 64);
}

async function incrementCounter(
  key: string,
  windowSeconds: number
): Promise<{ count: number; ttlRemaining: number }> {
  const hasAtomic =
    Object.prototype.hasOwnProperty.call(redisUtil, 'incrRateLimitWindow') &&
    typeof (redisUtil as { incrRateLimitWindow?: unknown }).incrRateLimitWindow === 'function';

  if (hasAtomic) {
    const res = await (
      redisUtil as {
        incrRateLimitWindow: (k: string, w: number) => Promise<{ count: number; ttlSeconds: number }>;
      }
    ).incrRateLimitWindow(key, windowSeconds);
    return { count: res.count, ttlRemaining: res.ttlSeconds };
  }

  return runSerialized(key, async () => {
    const now = Date.now();
    const raw = await redisUtil.getCache(key);
    let record: RateLimitRecord;
    if (raw) {
      const parsed = JSON.parse(raw) as RateLimitRecord;
      if (parsed.resetAt > now) {
        record = { count: parsed.count + 1, resetAt: parsed.resetAt };
      } else {
        record = { count: 1, resetAt: now + windowSeconds * 1000 };
      }
    } else {
      record = { count: 1, resetAt: now + windowSeconds * 1000 };
    }
    const ttlRemaining = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    await redisUtil.setCache(key, JSON.stringify(record), ttlRemaining);
    return { count: record.count, ttlRemaining };
  });
}

export function createAiRateLimiter(options: AiRateLimiterOptions) {
  const {
    prefix,
    windowSeconds,
    guestMax,
    authMax,
    errorCode = 'AI_RATE_LIMIT_EXCEEDED',
    message = 'Anh/chị thao tác hơi nhanh ạ. Vui lòng đợi khoảng 1 phút rồi tiếp tục nhắn tin cho em nhé.',
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const isAuthenticated = Boolean(userId);
      const limit = isAuthenticated ? authMax : guestMax;
      const key = isAuthenticated
        ? `${prefix}:user:${userId}`
        : `${prefix}:ip:${getClientIp(req)}`;

      const { count, ttlRemaining } = await incrementCounter(key, windowSeconds);

      if (count > limit) {
        res.status(429).json({
          success: false,
          code: 429,
          message,
          error: {
            code: errorCode,
            details: { retryAfterSeconds: ttlRemaining },
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      next();
    } catch (err) {
      logger.warn(`[${prefix}] Rate limiter cache error, failing open`, {
        error: (err as Error).message,
      });
      next();
    }
  };
}

/**
 * Customer AI Chat message limiter: Guest 15/60s, Customer 30/60s.
 */
export const aiChatRateLimiter = createAiRateLimiter({
  prefix: 'ai_chat:rl',
  windowSeconds: 60,
  guestMax: 15,
  authMax: 30,
});

/**
 * Customer AI Welcome limiter (protects authenticated 5-query DB burst): Guest 30/60s, Customer 60/60s.
 */
export const aiWelcomeRateLimiter = createAiRateLimiter({
  prefix: 'ai_welcome:rl',
  windowSeconds: 60,
  guestMax: 30,
  authMax: 60,
});

/**
 * Workshop Internal AI Planner/Parts limiter: 25 req/60s per authenticated staff user.
 */
export const aiWorkshopRateLimiter = createAiRateLimiter({
  prefix: 'ai_workshop:rl',
  windowSeconds: 60,
  guestMax: 10,
  authMax: 25,
  message: 'Thao tác gọi trợ lý kỹ thuật AI quá nhanh. Vui lòng đợi vài giây rồi thử lại.',
});
