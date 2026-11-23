import { Request, Response, NextFunction } from 'express';
import { getCache, setCache } from '../utils/redis.util';

const WINDOW_SECONDS = 60;
const GUEST_MAX_REQUESTS = 15;
const CUSTOMER_MAX_REQUESTS = 30;

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
    const firstValidIp = forwarded
      .split(',')
      .map((part) => part.trim())
      .find((part) => part.length > 0);
    if (firstValidIp) return firstValidIp;
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

/**
 * Sliding/fixed 60s window rate limiter for customer AI chat endpoints.
 * Guest: 15 req/60s per IP. Authenticated Customer: 30 req/60s per userId.
 * Fails open if cache encounters an unexpected error.
 */
export const aiChatRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const isAuthenticated = Boolean(userId);
    const limit = isAuthenticated ? CUSTOMER_MAX_REQUESTS : GUEST_MAX_REQUESTS;
    const key = isAuthenticated
      ? `ai_chat:rl:user:${userId}`
      : `ai_chat:rl:ip:${getClientIp(req)}`;

    const now = Date.now();
    const raw = await getCache(key);

    let record: RateLimitRecord;
    if (raw) {
      const parsed = JSON.parse(raw) as RateLimitRecord;
      if (parsed.resetAt > now) {
        record = { count: parsed.count + 1, resetAt: parsed.resetAt };
      } else {
        record = { count: 1, resetAt: now + WINDOW_SECONDS * 1000 };
      }
    } else {
      record = { count: 1, resetAt: now + WINDOW_SECONDS * 1000 };
    }

    const ttlRemaining = Math.max(1, Math.ceil((record.resetAt - now) / 1000));

    if (record.count > limit) {
      res.status(429).json({
        success: false,
        code: 429,
        message: 'Anh/chị thao tác hơi nhanh ạ. Vui lòng đợi khoảng 1 phút rồi tiếp tục nhắn tin cho em nhé.',
        error: {
          code: 'AI_RATE_LIMIT_EXCEEDED',
          details: { retryAfterSeconds: ttlRemaining },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    await setCache(key, JSON.stringify(record), ttlRemaining);
    next();
  } catch (err) {
    console.warn('[aiChatRateLimiter] Cache error, failing open:', (err as Error).message);
    next();
  }
};
