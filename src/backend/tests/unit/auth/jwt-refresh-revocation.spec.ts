import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';

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
    update: vi.fn(),
  },
}));

vi.mock('../../../src/utils/redis.util', () => cacheMock);
vi.mock('../../../src/utils/prisma', () => ({ default: prismaMock }));
vi.mock('../../../src/utils/email.util', () => ({ sendOtpEmail: vi.fn() }));

import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../../src/utils/jwt.util';
import {
  authService,
  BLACKLIST_JTI_KEY,
  TOKEN_INVALID_BEFORE_KEY,
} from '../../../src/services/auth.service';

describe('JWT Access & Refresh Token Rotation + Revocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cacheStore.clear();
  });

  it('prevents using a refresh token as an access token and vice versa', () => {
    const access = generateAccessToken({
      id: 1,
      email: 'a@b.com',
      fullName: 'User A',
      roles: ['CUSTOMER'],
    });
    const { token: refresh } = generateRefreshToken({
      id: 1,
      familyId: 'fam-1',
      portal: 'customer',
    });

    expect(() => verifyAccessToken(refresh)).toThrow('Invalid token type');
    expect(() => verifyRefreshToken(access)).toThrow('Invalid token type');
  });

  it('rotates refresh tokens and triggers reuse detection if old refresh token is replayed', async () => {
    const hash = await bcrypt.hash('Pass1234', 4);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 10,
      email: 'cust@autocare.vn',
      full_name: 'Khách Hàng A',
      password_hash: hash,
      is_active: true,
      roles: [{ role: { name: 'CUSTOMER' } }],
    });

    const loginRes = await authService.login('cust@autocare.vn', 'Pass1234', 'customer');
    expect(loginRes.token).toBeTruthy();
    expect(loginRes.refreshToken).toBeTruthy();

    const firstRefreshDecoded = verifyRefreshToken(loginRes.refreshToken);
    const familyKey = `rt_family:10:${firstRefreshDecoded.familyId}`;
    expect(cacheStore.get(familyKey)).toBe(firstRefreshDecoded.jti);

    // Rotate 1st time -> succeeds and replaces jti
    const rotated = await authService.refreshSession(loginRes.refreshToken, 'customer');
    expect(rotated.token).toBeTruthy();
    expect(rotated.refreshToken).not.toBe(loginRes.refreshToken);

    const secondRefreshDecoded = verifyRefreshToken(rotated.refreshToken);
    expect(secondRefreshDecoded.familyId).toBe(firstRefreshDecoded.familyId);
    expect(cacheStore.get(familyKey)).toBe(secondRefreshDecoded.jti);

    // Replay 1st (already used) refresh token -> Reuse Detection revokes the whole family
    await expect(
      authService.refreshSession(loginRes.refreshToken, 'customer')
    ).rejects.toThrow('Phiên làm việc đã hết hạn hoặc bị thu hồi');
    expect(cacheStore.has(familyKey)).toBe(false);

    // Even the 2nd rotated token is now rejected because the family was wiped
    await expect(
      authService.refreshSession(rotated.refreshToken, 'customer')
    ).rejects.toThrow('Phiên làm việc đã hết hạn hoặc bị thu hồi');
  });

  it('blacklists access token jti and deletes refresh family on logout', async () => {
    const hash = await bcrypt.hash('Pass1234', 4);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 11,
      email: 'staff@autocare.vn',
      full_name: 'Nhân Viên A',
      password_hash: hash,
      is_active: true,
      roles: [{ role: { name: 'SA' } }],
    });

    const loginRes = await authService.login('staff@autocare.vn', 'Pass1234', 'internal');
    const accessDecoded = verifyAccessToken(loginRes.token);
    const refreshDecoded = verifyRefreshToken(loginRes.refreshToken);

    await authService.logout({
      accessToken: loginRes.token,
      refreshToken: loginRes.refreshToken,
    });

    expect(cacheStore.get(BLACKLIST_JTI_KEY(accessDecoded.jti!))).toBe('1');
    expect(cacheStore.has(`rt_family:11:${refreshDecoded.familyId}`)).toBe(false);
  });

  it('rejects refresh token issued before token_invalid_before timestamp', async () => {
    const { token: oldRefresh } = generateRefreshToken({
      id: 12,
      familyId: 'fam-old',
      portal: 'customer',
    });
    const decoded = verifyRefreshToken(oldRefresh);
    cacheStore.set(`rt_family:12:fam-old`, decoded.jti);
    // Simulate password change 10 seconds after token iat
    cacheStore.set(TOKEN_INVALID_BEFORE_KEY(12), String((decoded.iat || 0) + 10));

    await expect(authService.refreshSession(oldRefresh, 'customer')).rejects.toThrow(
      'Phiên đăng nhập đã hết hiệu lực do thay đổi bảo mật'
    );
  });
});
