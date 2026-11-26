import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { getCache, setCache } from '../utils/redis.util';

const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60; // 24 hours per API_CONVENTION.md

interface CachedIdempotentResponse {
  statusCode: number;
  bodyHash: string;
  body: unknown;
}

/**
 * Optional Idempotency-Key guard for financial & handover mutations.
 * - If no Idempotency-Key header is provided, proceeds normally (backward compatible).
 * - If provided and key matches same payload hash within 24h, replays cached response.
 * - If key is reused with a different request payload, rejects with 409 Conflict.
 */
export const idempotencyGuard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const rawKey = req.headers['idempotency-key'];
  const key = Array.isArray(rawKey) ? rawKey[0]?.trim() : rawKey?.trim();
  if (!key) {
    next();
    return;
  }

  const userId = req.user?.id ?? 'anon';
  const cacheKey = `idem:${userId}:${req.method}:${req.baseUrl}${req.path}:${key}`;
  const bodyHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(req.body ?? {}))
    .digest('hex');

  try {
    const existingRaw = await getCache(cacheKey);
    if (existingRaw) {
      const cached = JSON.parse(existingRaw) as CachedIdempotentResponse;
      if (cached.bodyHash !== bodyHash) {
        res.status(409).json({
          success: false,
          code: 409,
          message: 'Idempotency-Key đã được sử dụng với dữ liệu khác.',
          error: { code: 'IDEMPOTENCY_KEY_CONFLICT' },
          timestamp: new Date().toISOString(),
        });
        return;
      }
      res.status(cached.statusCode).json(cached.body);
      return;
    }
  } catch {
    // Fail-open on cache read error; DB constraints remain as safety net
  }

  const originalJson = res.json.bind(res);
  res.json = ((payload: unknown) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const entry: CachedIdempotentResponse = {
        statusCode: res.statusCode,
        bodyHash,
        body: payload,
      };
      void setCache(cacheKey, JSON.stringify(entry), IDEMPOTENCY_TTL_SECONDS).catch(() => {});
    }
    return originalJson(payload);
  }) as Response['json'];

  next();
};
