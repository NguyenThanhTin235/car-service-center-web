import { describe, it, expect } from 'vitest';
import { generateToken, verifyToken, JwtPayload } from '../../../src/utils/jwt.util';
import {
  generateOtp,
  hashOtp,
  verifyOtp,
  getOtpExpiresAt,
  isOtpExpired,
} from '../../../src/utils/otp.util';

describe('Auth Helpers & Security Utilities (SPEC-AUTH-01)', () => {
  describe('JWT Utility (jwt.util.ts)', () => {
    const mockPayload: JwtPayload = {
      id: 101,
      email: 'advisor@carservice.vn',
      fullName: 'Trần Văn Cố Vấn',
      roles: ['SA'],
    };

    it('JWT-01: Sinh token và giải mã payload chính xác', () => {
      const token = generateToken(mockPayload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // Header.Payload.Signature

      const decoded = verifyToken(token);
      expect(decoded.id).toBe(mockPayload.id);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.fullName).toBe(mockPayload.fullName);
      expect(decoded.roles).toEqual(['SA']);
    });

    it('JWT-02: Báo lỗi khi token bị giả mạo chữ ký (Tampered Token)', () => {
      const validToken = generateToken(mockPayload);
      const tamperedToken = validToken.slice(0, -6) + 'abcdef';

      expect(() => verifyToken(tamperedToken)).toThrow();
    });

    it('JWT-03: Báo lỗi khi truyền chuỗi token rỗng hoặc không đúng định dạng', () => {
      expect(() => verifyToken('')).toThrow();
      expect(() => verifyToken('invalid.token.here')).toThrow();
    });
  });

  describe('OTP Utility (otp.util.ts)', () => {
    it('OTP-01: Sinh mã OTP đúng 6 chữ số ngẫu nhiên', () => {
      const otp1 = generateOtp();
      const otp2 = generateOtp();

      expect(otp1).toHaveLength(6);
      expect(/^\d{6}$/.test(otp1)).toBe(true);
      expect(Number(otp1)).toBeGreaterThanOrEqual(100000);
      expect(Number(otp1)).toBeLessThanOrEqual(999999);
      expect(otp1).not.toBe(otp2); // Xác suất trùng lặp 1 / 900,000
    });

    it('OTP-02: Hash và Verify OTP bằng bcrypt', async () => {
      const plainOtp = generateOtp();
      const hashedOtp = await hashOtp(plainOtp);

      expect(typeof hashedOtp).toBe('string');
      expect(hashedOtp).not.toBe(plainOtp);

      // Verify đúng mã
      const isMatch = await verifyOtp(plainOtp, hashedOtp);
      expect(isMatch).toBe(true);

      // Verify sai mã
      const isMismatch = await verifyOtp('000000', hashedOtp);
      expect(isMismatch).toBe(false);
    });

    it('OTP-03: Tính thời hạn hiệu lực 5 phút và kiểm tra hết hạn (isOtpExpired)', () => {
      const expiresAt = getOtpExpiresAt();
      const now = new Date();

      // Thời điểm hết hạn phải lớn hơn hiện tại khoảng 4.9 - 5.1 phút
      const diffMinutes = (expiresAt.getTime() - now.getTime()) / (1000 * 60);
      expect(diffMinutes).toBeGreaterThan(4.8);
      expect(diffMinutes).toBeLessThan(5.2);

      // Chưa hết hạn
      expect(isOtpExpired(expiresAt)).toBe(false);

      // Đã hết hạn (trong quá khứ)
      const pastDate = new Date(Date.now() - 60 * 1000);
      expect(isOtpExpired(pastDate)).toBe(true);

      // null date
      expect(isOtpExpired(null)).toBe(true);
    });
  });
});

