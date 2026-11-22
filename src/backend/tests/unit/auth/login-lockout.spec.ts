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
  authService,
  LoginLockedError,
  LOGIN_LOCKED_MESSAGE,
  MAX_LOGIN_ATTEMPTS,
} from '../../../src/services/auth.service';

describe('AuthService — Login Brute-force Lockout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cacheStore.clear();
  });

  it('locks login after 5 consecutive failed password attempts and throws LoginLockedError', async () => {
    const hash = await bcrypt.hash('CorrectPass123', 4);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'user@autocare.vn',
      full_name: 'Test User',
      password_hash: hash,
      is_active: true,
      roles: [{ role: { name: 'CUSTOMER' } }],
    });

    for (let i = 1; i < MAX_LOGIN_ATTEMPTS; i++) {
      await expect(authService.login('user@autocare.vn', 'WrongPass')).rejects.toThrow(
        'Email hoặc mật khẩu không đúng'
      );
    }

    // 5th failed attempt triggers lock
    await expect(authService.login('user@autocare.vn', 'WrongPass')).rejects.toThrow(
      LoginLockedError
    );

    // Subsequent attempt even with correct password is blocked while locked
    await expect(authService.login('user@autocare.vn', 'CorrectPass123')).rejects.toThrow(
      LOGIN_LOCKED_MESSAGE
    );
  });

  it('resets failed login counter after a successful login', async () => {
    const hash = await bcrypt.hash('CorrectPass123', 4);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 2,
      email: 'user2@autocare.vn',
      full_name: 'Test User 2',
      password_hash: hash,
      is_active: true,
      roles: [{ role: { name: 'CUSTOMER' } }],
    });

    // 3 failed attempts
    for (let i = 0; i < 3; i++) {
      await expect(authService.login('user2@autocare.vn', 'WrongPass')).rejects.toThrow(
        'Email hoặc mật khẩu không đúng'
      );
    }

    // Successful login resets counter
    const result = await authService.login('user2@autocare.vn', 'CorrectPass123');
    expect(result.token).toBeTruthy();
    expect(cacheStore.has('login_fail:user2@autocare.vn')).toBe(false);
  });
});
