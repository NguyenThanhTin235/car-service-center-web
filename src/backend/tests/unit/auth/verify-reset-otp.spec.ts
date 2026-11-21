import { describe, it, expect, vi, beforeEach } from 'vitest';

const cacheMock = vi.hoisted(() => ({
  getCache: vi.fn(),
  setCache: vi.fn(),
  deleteCache: vi.fn(),
}));

const otpMock = vi.hoisted(() => ({
  generateOtp: vi.fn(),
  hashOtp: vi.fn(),
  verifyOtp: vi.fn(),
  isOtpExpired: vi.fn(),
  getOtpExpiresAt: vi.fn(),
}));

vi.mock('../../../src/utils/redis.util', () => cacheMock);
vi.mock('../../../src/utils/otp.util', () => otpMock);
vi.mock('../../../src/utils/email.util', () => ({ sendOtpEmail: vi.fn() }));
vi.mock('../../../src/utils/prisma', () => ({ default: {} }));

import { authService } from '../../../src/services/auth.service';

describe('AuthService.verifyResetOtp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws expired error when no pending reset session exists', async () => {
    cacheMock.getCache.mockResolvedValue(null);

    await expect(authService.verifyResetOtp('a@b.com', '123456')).rejects.toThrow(
      'Mã OTP không hợp lệ hoặc đã hết hạn'
    );
  });

  it('throws wrong OTP error when OTP does not match', async () => {
    cacheMock.getCache.mockResolvedValue(JSON.stringify({ email: 'a@b.com', otpHash: 'hash' }));
    otpMock.verifyOtp.mockResolvedValue(false);

    await expect(authService.verifyResetOtp('a@b.com', '999999')).rejects.toThrow(
      'Mã OTP không đúng. Vui lòng kiểm tra lại.'
    );
  });

  it('resolves and keeps the OTP session when OTP is valid', async () => {
    cacheMock.getCache.mockResolvedValue(JSON.stringify({ email: 'a@b.com', otpHash: 'hash' }));
    otpMock.verifyOtp.mockResolvedValue(true);

    await expect(authService.verifyResetOtp('a@b.com', '123456')).resolves.toBeUndefined();
    expect(cacheMock.deleteCache).not.toHaveBeenCalled();
  });
});
