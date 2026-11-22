import { describe, it, expect } from 'vitest';
import { sendOtpRegisterSchema, FULL_NAME_REGEX } from '../../../src/dtos/auth.dto';

const INVALID_MSG = 'Vui lòng nhập họ và tên hợp lệ, không nhập số hoặc ký tự đặc biệt.';

const base = {
  phone: '0901234567',
  email: 'an.tran@example.com',
  password: 'MatKhau@123',
};

describe('Full name validation (register & update profile)', () => {
  it.each(['Trần Văn An', 'Nguyễn Thị Ánh Tuyết', 'Lê Ngọc Ẩn'])(
    'accepts Vietnamese name "%s"',
    (fullName) => {
      const { error } = sendOtpRegisterSchema.validate({ ...base, fullName });
      expect(error).toBeUndefined();
    }
  );

  it.each(['Trần Văn An 123', 'Nguyen@An', 'An_Tran', '<script>', 'Lê Văn #1'])(
    'rejects name with digits or special characters "%s"',
    (fullName) => {
      const { error } = sendOtpRegisterSchema.validate({ ...base, fullName });
      expect(error?.details[0].message).toBe(INVALID_MSG);
    }
  );

  it('exposes the same regex for profile update checks', () => {
    expect(FULL_NAME_REGEX.test('Nhân Viên 9')).toBe(false);
    expect(FULL_NAME_REGEX.test('Nguyễn Văn Bình')).toBe(true);
  });
});
