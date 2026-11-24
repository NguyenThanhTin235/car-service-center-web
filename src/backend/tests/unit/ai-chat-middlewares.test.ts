import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

const cacheStore = new Map<string, string>();
const cacheMock = vi.hoisted(() => ({
  getCache: vi.fn(async (key: string) => cacheStore.get(key) ?? null),
  setCache: vi.fn(async (key: string, val: string) => {
    cacheStore.set(key, val);
  }),
  deleteCache: vi.fn(async (key: string) => {
    cacheStore.delete(key);
  }),
}));

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
}));

vi.mock('../../src/utils/redis.util', () => cacheMock);
vi.mock('../../src/utils/prisma', () => ({ default: prismaMock }));

import { optionalAuthenticate } from '../../src/middlewares/auth.middleware';
import { aiChatRateLimiter } from '../../src/middlewares/ai-chat-rate-limit.middleware';
import { generateAccessToken, verifyAccessToken } from '../../src/utils/jwt.util';
import { BLACKLIST_JTI_KEY } from '../../src/services/auth.service';

function createRes() {
  const res: any = { statusCode: 200, body: undefined };
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((payload: any) => {
    res.body = payload;
    return res;
  });
  return res;
}

describe('AI Chat Middlewares — optionalAuthenticate & aiChatRateLimiter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cacheStore.clear();
  });

  describe('optionalAuthenticate', () => {
    it('allows guest requests with no token and sets req.user to undefined', async () => {
      const req: any = { headers: { 'x-portal': 'customer' }, cookies: {} };
      const res = createRes();
      const next = vi.fn();

      await optionalAuthenticate(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('populates req.user with live DB roles when Bearer JWT is valid', async () => {
      const token = generateAccessToken({
        id: 55,
        email: 'cus@example.com',
        fullName: 'Nguyen Van Khach',
        roles: ['CUSTOMER'],
      });

      prismaMock.user.findUnique.mockResolvedValue({
        is_active: true,
        roles: [{ role: { name: 'CUSTOMER' } }],
      });

      const req: any = {
        headers: { authorization: `Bearer ${token}`, 'x-portal': 'customer' },
        cookies: {},
      };
      const res = createRes();
      const next = vi.fn();

      await optionalAuthenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toMatchObject({
        id: 55,
        email: 'cus@example.com',
        roles: ['CUSTOMER'],
      });
    });

    it('returns HTTP 401 TOKEN_EXPIRED when explicit Bearer JWT is expired', async () => {
      const secret = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
      const expiredToken = jwt.sign(
        { id: 55, email: 'cus@example.com', fullName: 'Khach', roles: ['CUSTOMER'], type: 'access' },
        secret,
        { expiresIn: -10 }
      );

      const req: any = {
        headers: { authorization: `Bearer ${expiredToken}`, 'x-portal': 'customer' },
        cookies: {},
      };
      const res = createRes();
      const next = vi.fn();

      await optionalAuthenticate(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body).toMatchObject({
        success: false,
        code: 401,
        error: { code: 'TOKEN_EXPIRED' },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns HTTP 401 SESSION_REVOKED when Bearer JWT is blacklisted', async () => {
      const token = generateAccessToken({
        id: 55,
        email: 'cus@example.com',
        fullName: 'Khach',
        roles: ['CUSTOMER'],
      });
      const decoded = verifyAccessToken(token);
      cacheStore.set(BLACKLIST_JTI_KEY(decoded.jti!), '1');

      const req: any = {
        headers: { authorization: `Bearer ${token}`, 'x-portal': 'customer' },
        cookies: {},
      };
      const res = createRes();
      const next = vi.fn();

      await optionalAuthenticate(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body).toMatchObject({
        success: false,
        code: 401,
        error: { code: 'SESSION_REVOKED' },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('degrades cleanly to Guest mode if stale cookie exists without Bearer header', async () => {
      const req: any = {
        headers: { 'x-portal': 'customer' },
        cookies: { customer_jwt: 'invalid.stale.cookie' },
      };
      const res = createRes();
      const next = vi.fn();

      await optionalAuthenticate(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('aiChatRateLimiter', () => {
    it('allows up to 15 requests/min for Guest and blocks the 16th with HTTP 429', async () => {
      for (let i = 1; i <= 15; i++) {
        const req: any = { headers: {}, ip: '10.0.0.1', socket: {} };
        const res = createRes();
        const next = vi.fn();
        await aiChatRateLimiter(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
      }

      const blockedReq: any = { headers: {}, ip: '10.0.0.1', socket: {} };
      const blockedRes = createRes();
      const blockedNext = vi.fn();
      await aiChatRateLimiter(blockedReq, blockedRes, blockedNext);

      expect(blockedNext).not.toHaveBeenCalled();
      expect(blockedRes.statusCode).toBe(429);
      expect(blockedRes.body).toMatchObject({
        success: false,
        code: 429,
        error: { code: 'AI_RATE_LIMIT_EXCEEDED' },
      });
    });

    it('allows up to 30 requests/min for Customer and blocks the 31st with HTTP 429', async () => {
      for (let i = 1; i <= 30; i++) {
        const req: any = { headers: {}, user: { id: 101 }, ip: '10.0.0.2', socket: {} };
        const res = createRes();
        const next = vi.fn();
        await aiChatRateLimiter(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
      }

      const blockedReq: any = { headers: {}, user: { id: 101 }, ip: '10.0.0.2', socket: {} };
      const blockedRes = createRes();
      const blockedNext = vi.fn();
      await aiChatRateLimiter(blockedReq, blockedRes, blockedNext);

      expect(blockedNext).not.toHaveBeenCalled();
      expect(blockedRes.statusCode).toBe(429);
      expect(blockedRes.body).toMatchObject({
        success: false,
        code: 429,
        error: { code: 'AI_RATE_LIMIT_EXCEEDED' },
      });
    });
  });
});
