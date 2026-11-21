import { describe, it, expect, vi, beforeEach } from 'vitest';

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

vi.mock('../../../src/utils/redis.util', () => cacheMock);
vi.mock('../../../src/utils/prisma', () => ({ default: prismaMock }));

import { authenticate, authorize } from '../../../src/middlewares/auth.middleware';
import { generateAccessToken, verifyAccessToken } from '../../../src/utils/jwt.util';
import { BLACKLIST_JTI_KEY, TOKEN_INVALID_BEFORE_KEY } from '../../../src/services/auth.service';

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

describe('Auth Middleware — Revocation, Portal Isolation & RBAC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cacheStore.clear();
  });

  it('rejects blacklisted access token (logged out) with 401', async () => {
    const token = generateAccessToken({
      id: 1,
      email: 'a@b.com',
      fullName: 'User A',
      roles: ['ADMIN'],
    });
    const decoded = verifyAccessToken(token);
    cacheStore.set(BLACKLIST_JTI_KEY(decoded.jti!), '1');

    const req: any = {
      headers: { authorization: `Bearer ${token}`, 'x-portal': 'internal' },
      cookies: {},
    };
    const res = createRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects access token issued before password change (token_invalid_before)', async () => {
    const token = generateAccessToken({
      id: 2,
      email: 'b@b.com',
      fullName: 'User B',
      roles: ['CUSTOMER'],
    });
    const decoded = verifyAccessToken(token);
    cacheStore.set(TOKEN_INVALID_BEFORE_KEY(2), String((decoded.iat || 0) + 5));

    const req: any = {
      headers: { authorization: `Bearer ${token}`, 'x-portal': 'customer' },
      cookies: {},
    };
    const res = createRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('does not fall back to customer_jwt cookie on internal portal', async () => {
    const customerToken = generateAccessToken({
      id: 3,
      email: 'c@b.com',
      fullName: 'Customer',
      roles: ['CUSTOMER'],
    });

    const req: any = {
      headers: { 'x-portal': 'internal' },
      cookies: { customer_jwt: customerToken },
    };
    const res = createRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('authorizes roles case-insensitively and blocks unauthorized roles with 403', () => {
    const guard = authorize('ADMIN', 'MANAGER');
    const nextOk = vi.fn();
    guard(
      { user: { id: 1, email: 'a@b.com', fullName: 'A', roles: ['admin'] } } as any,
      createRes(),
      nextOk
    );
    expect(nextOk).toHaveBeenCalledTimes(1);

    const res403 = createRes();
    const nextDenied = vi.fn();
    guard(
      { user: { id: 2, email: 'c@b.com', fullName: 'C', roles: ['CUSTOMER'] } } as any,
      res403,
      nextDenied
    );
    expect(res403.statusCode).toBe(403);
    expect(nextDenied).not.toHaveBeenCalled();
  });
});
