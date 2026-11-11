import { describe, it, expect } from 'vitest';

export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const VN_PHONE_REGEX = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;

export function validateEmail(email?: string, fieldName = 'Email'): string | null {
  if (!email || !email.trim()) {
    return `${fieldName} không được để trống`;
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return 'Địa chỉ email không đúng định dạng (VD: nhanvien@carservice.vn)';
  }
  return null;
}

export function validatePhone(phone?: string, required = false, fieldName = 'Số điện thoại'): string | null {
  if (!phone || !phone.trim()) {
    if (required) return `${fieldName} không được để trống`;
    return null;
  }
  const cleanPhone = phone.trim().replace(/[\s.-]/g, '');
  if (!VN_PHONE_REGEX.test(cleanPhone)) {
    return 'Số điện thoại không hợp lệ (gồm 10 số, VD: 0901234567)';
  }
  return null;
}

export function validateName(
  name?: string,
  fieldName = 'Họ và tên',
  min = 2,
  max = 120
): string | null {
  if (!name || !name.trim()) {
    return `${fieldName} không được để trống`;
  }
  const trimmed = name.trim();
  if (trimmed.length < min) {
    return `${fieldName} phải có tối thiểu ${min} ký tự`;
  }
  if (trimmed.length > max) {
    return `${fieldName} không được vượt quá ${max} ký tự`;
  }
  return null;
}

export function validatePassword(password?: string, min = 6, fieldName = 'Mật khẩu'): string | null {
  if (!password) {
    return `${fieldName} không được để trống`;
  }
  if (password.trim().length === 0) {
    return `${fieldName} không được chỉ chứa ký tự khoảng trắng`;
  }
  if (password.length < min) {
    return `${fieldName} phải có tối thiểu ${min} ký tự`;
  }
  return null;
}

export function validatePrice(
  price: string | number,
  fieldName = 'Đơn giá',
  allowZero = true
): string | null {
  if (price === '' || price === undefined || price === null) {
    return `${fieldName} không được để trống`;
  }
  const num = typeof price === 'number' ? price : Number(price);
  if (isNaN(num)) {
    return `${fieldName} phải là chữ số hợp lệ`;
  }
  if (num < 0) {
    return `${fieldName} không được là số âm`;
  }
  if (!allowZero && num === 0) {
    return `${fieldName} phải lớn hơn 0 ₫`;
  }
  return null;
}

export function validateInteger(
  val: string | number,
  fieldName = 'Giá trị',
  min = 0
): string | null {
  if (val === '' || val === undefined || val === null) {
    return null;
  }
  const num = typeof val === 'number' ? val : Number(val);
  if (isNaN(num) || !Number.isInteger(num)) {
    return `${fieldName} phải là số nguyên hợp lệ`;
  }
  if (num < min) {
    return `${fieldName} không được nhỏ hơn ${min}`;
  }
  return null;
}

describe('Unit Test - Portal Admin Input Validation Suite', () => {
  describe('VAL-01: Kiểm tra định dạng Email', () => {
    it('Chấp nhận các email hợp lệ', () => {
      expect(validateEmail('admin@carservice.vn')).toBeNull();
      expect(validateEmail('tech.viet@gmail.com')).toBeNull();
      expect(validateEmail('advisor_01@toyota.com.vn')).toBeNull();
    });

    it('Từ chối email rỗng hoặc sai cú pháp', () => {
      expect(validateEmail('')).toContain('không được để trống');
      expect(validateEmail('   ')).toContain('không được để trống');
      expect(validateEmail('admin')).toContain('không đúng định dạng');
      expect(validateEmail('admin@')).toContain('không đúng định dạng');
      expect(validateEmail('admin@vn')).toContain('không đúng định dạng');
    });
  });

  describe('VAL-02: Kiểm tra số điện thoại Việt Nam', () => {
    it('Chấp nhận các số điện thoại 10 số hợp lệ', () => {
      expect(validatePhone('0901234567')).toBeNull();
      expect(validatePhone('0987654321')).toBeNull();
      expect(validatePhone('0398765432')).toBeNull();
      expect(validatePhone('+84901234567')).toBeNull();
      expect(validatePhone('090 123 4567')).toBeNull();
    });

    it('Cho phép bỏ trống khi không bắt buộc', () => {
      expect(validatePhone('', false)).toBeNull();
      expect(validatePhone(undefined, false)).toBeNull();
    });

    it('Bắt buộc nhập khi required = true', () => {
      expect(validatePhone('', true)).toContain('không được để trống');
    });

    it('Từ chối số điện thoại sai độ dài hoặc chứa chữ cái', () => {
      expect(validatePhone('012345678')).toContain('không hợp lệ');
      expect(validatePhone('090123456789')).toContain('không hợp lệ');
      expect(validatePhone('09012abcde')).toContain('không hợp lệ');
    });
  });

  describe('VAL-03: Kiểm tra Họ và tên / Tên dịch vụ', () => {
    it('Chấp nhận tên hợp lệ có độ dài >= 2', () => {
      expect(validateName('Nguyễn Văn A')).toBeNull();
      expect(validateName('Thay dầu động cơ', 'Tên dịch vụ')).toBeNull();
    });

    it('Từ chối tên rỗng hoặc toàn khoảng trắng', () => {
      expect(validateName('')).toContain('không được để trống');
      expect(validateName('   ')).toContain('không được để trống');
      expect(validateName('A')).toContain('tối thiểu 2 ký tự');
    });
  });

  describe('VAL-04: Kiểm tra Mật khẩu', () => {
    it('Chấp nhận mật khẩu >= 6 ký tự', () => {
      expect(validatePassword('123456')).toBeNull();
      expect(validatePassword('Pass@123')).toBeNull();
    });

    it('Từ chối mật khẩu < 6 ký tự hoặc toàn khoảng trắng', () => {
      expect(validatePassword('')).toContain('không được để trống');
      expect(validatePassword('12345')).toContain('tối thiểu 6 ký tự');
      expect(validatePassword('      ')).toContain('không được chỉ chứa ký tự khoảng trắng');
    });
  });

  describe('VAL-05: Kiểm tra Đơn giá & Số nguyên', () => {
    it('Chấp nhận giá tiền >= 0', () => {
      expect(validatePrice(0)).toBeNull();
      expect(validatePrice('250000')).toBeNull();
      expect(validatePrice(1500000)).toBeNull();
    });

    it('Từ chối giá âm hoặc ký tự chữ', () => {
      expect(validatePrice(-1000)).toContain('không được là số âm');
      expect(validatePrice('abc')).toContain('phải là chữ số hợp lệ');
      expect(validatePrice('', 'Giá cố định')).toContain('không được để trống');
    });

    it('Kiểm tra số nguyên thứ tự hiển thị', () => {
      expect(validateInteger(1)).toBeNull();
      expect(validateInteger(0)).toBeNull();
      expect(validateInteger(-1, 'Thứ tự', 0)).toContain('không được nhỏ hơn 0');
      expect(validateInteger(2.5, 'Thứ tự')).toContain('phải là số nguyên hợp lệ');
    });
  });
});
