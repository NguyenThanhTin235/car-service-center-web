import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const cacheStore = new Map<string, string>();
const cacheMock = vi.hoisted(() => ({
  getCache: vi.fn(async (key: string) => cacheStore.get(key) ?? null),
  setCache: vi.fn(async (key: string, val: string) => {
    cacheStore.set(key, val);
  }),
  deleteCache: vi.fn(async (key: string) => {
    cacheStore.delete(key);
  }),
  mgetCache: vi.fn(async (keys: string[]) => keys.map((k) => cacheStore.get(k) ?? null)),
}));

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
}));

vi.mock('../../../src/utils/redis.util', () => cacheMock);
vi.mock('../../../src/utils/prisma', () => ({ default: prismaMock }));

import { authenticate, USER_AUTH_CACHE_KEY } from '../../../src/middlewares/auth.middleware';
import { idempotencyGuard } from '../../../src/middlewares/idempotency.middleware';
import { generateAccessToken } from '../../../src/utils/jwt.util';

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

describe('Performance & Security: Auth User Cache & Idempotency Middleware', () => {
  const prevCacheEnv = process.env.ENABLE_AUTH_USER_CACHE;

  beforeEach(() => {
    vi.clearAllMocks();
    cacheStore.clear();
    process.env.ENABLE_AUTH_USER_CACHE = 'true';
  });

  afterEach(() => {
    if (prevCacheEnv === undefined) {
      delete process.env.ENABLE_AUTH_USER_CACHE;
    } else {
      process.env.ENABLE_AUTH_USER_CACHE = prevCacheEnv;
    }
  });

  it('caches user active/roles in Redis after first DB hit and enforces immediate invalidation', async () => {
    const token = generateAccessToken({
      id: 42,
      email: 'advisor@autocare.vn',
      fullName: 'Cố vấn',
      roles: ['SA'],
    });
    prismaMock.user.findUnique.mockResolvedValue({
      is_active: true,
      roles: [{ role: { name: 'SA' } }],
    });

    const req1: any = { headers: { authorization: `Bearer ${token}`, 'x-portal': 'internal' }, cookies: {} };
    const next1 = vi.fn();
    await authenticate(req1, createRes(), next1);
    expect(next1).toHaveBeenCalledTimes(1);
    expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);

    // Second request uses Redis MGET cache without hitting MySQL
    const req2: any = { headers: { authorization: `Bearer ${token}`, 'x-portal': 'internal' }, cookies: {} };
    const next2 = vi.fn();
    await authenticate(req2, createRes(), next2);
    expect(next2).toHaveBeenCalledTimes(1);
    expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);

    // Simulate cache invalidation after role/status change
    cacheStore.delete(USER_AUTH_CACHE_KEY(42));
    prismaMock.user.findUnique.mockResolvedValue({
      is_active: false,
      roles: [{ role: { name: 'SA' } }],
    });

    const res3 = createRes();
    const next3 = vi.fn();
    await authenticate(
      { headers: { authorization: `Bearer ${token}`, 'x-portal': 'internal' }, cookies: {} } as any,
      res3,
      next3
    );
    expect(res3.statusCode).toBe(401);
    expect(next3).not.toHaveBeenCalled();
  });

  it('idempotencyGuard replays cached 201 response for same key+payload and rejects payload mismatch with 409', async () => {
    const req1: any = {
      method: 'POST',
      baseUrl: '/api/invoices',
      path: '/',
      user: { id: 7 },
      headers: { 'idempotency-key': 'idem-key-001' },
      body: { workOrderId: 10 },
    };
    const res1 = createRes();
    const next1 = vi.fn(() => {
      res1.status(201).json({ success: true, data: { invoiceId: 99 } });
    });

    await idempotencyGuard(req1, res1, next1);
    expect(next1).toHaveBeenCalledTimes(1);
    expect(res1.statusCode).toBe(201);

    // Replay same key & same payload -> skips controller (next2 not called)
    const res2 = createRes();
    const next2 = vi.fn();
    await idempotencyGuard({ ...req1 }, res2, next2);
    expect(next2).not.toHaveBeenCalled();
    expect(res2.statusCode).toBe(201);
    expect(res2.body).toEqual({ success: true, data: { invoiceId: 99 } });

    // Same key but different payload -> 409 Conflict
    const res3 = createRes();
    const next3 = vi.fn();
    await idempotencyGuard({ ...req1, body: { workOrderId: 11 } }, res3, next3);
    expect(next3).not.toHaveBeenCalled();
    expect(res3.statusCode).toBe(409);
  });
});
