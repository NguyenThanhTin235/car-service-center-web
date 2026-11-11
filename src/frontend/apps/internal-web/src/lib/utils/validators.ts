/**
 * Module kiểm tra và chuẩn hóa dữ liệu đầu vào (Form Validators)
 * Dành riêng cho hệ thống quản trị xe và nhân sự Car Service Center
 */

export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Định dạng số điện thoại Việt Nam chuẩn (10 chữ số, đầu số nhà mạng 03, 05, 07, 08, 09 hoặc +84)
 */
export const VN_PHONE_REGEX = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;

/**
 * Validate địa chỉ email
 */
export function validateEmail(email?: string, fieldName = 'Email'): string | null {
  if (!email || !email.trim()) {
    return `${fieldName} không được để trống`;
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return 'Địa chỉ email không đúng định dạng (VD: nhanvien@carservice.vn)';
  }
  return null;
}

/**
 * Validate số điện thoại Việt Nam (hỗ trợ tùy chọn bắt buộc hoặc không bắt buộc)
 */
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

/**
 * Validate tên (người dùng, danh mục, dịch vụ)
 */
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

/**
 * Validate mật khẩu khởi tạo / đặt lại
 */
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

/**
 * Validate đơn giá (VNĐ)
 */
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

/**
 * Validate số nguyên dương (thứ tự sắp xếp, số lượng)
 */
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

/**
 * Validate trường bắt buộc chung (dropdown, textarea, radio)
 */
export function validateRequired(val?: string, fieldName = 'Trường này'): string | null {
  if (!val || !val.trim()) {
    return `${fieldName} không được để trống`;
  }
  return null;
}
