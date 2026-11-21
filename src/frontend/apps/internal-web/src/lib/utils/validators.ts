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
 * Validate địa chỉ email (hỗ trợ tùy chọn bắt buộc hoặc không bắt buộc)
 */
export function validateEmail(email?: string, fieldName = 'Email', required = true): string | null {
  if (!email || !email.trim()) {
    return required ? `${fieldName} không được để trống` : null;
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return 'Định dạng email không hợp lệ.';
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
 * @param price Giá trị cần kiểm tra (string hoặc number)
 * @param fieldName Tên trường hiển thị lỗi
 * @param allowZero Cho phép giá = 0 hay không (mặc định false)
 * @param allowDecimal Cho phép số thập phân hay không (mặc định false vì tiền VNĐ là số nguyên)
 * @param requireThousands Bắt buộc tròn theo đơn vị nghìn đồng (bội số của 1.000 ₫, mặc định true)
 */
export function validatePrice(
  price: string | number,
  fieldName = 'Đơn giá',
  allowZero = false,
  allowDecimal = false,
  requireThousands = true
): string | null {
  if (price === '' || price === undefined || price === null) {
    return `${fieldName} không được để trống`;
  }

  const strPrice = String(price).trim();
  if (strPrice === '') {
    return `${fieldName} không được để trống`;
  }

  // 1. Kiểm tra không được chứa ký tự chữ cái
  if (/[a-zA-ZÀ-ỹ]/.test(strPrice)) {
    return `${fieldName} phải là chữ số, không được chứa ký tự chữ`;
  }

  // 2. Kiểm tra không được là số thập phân
  if (!allowDecimal && (strPrice.includes('.') || strPrice.includes(','))) {
    return `${fieldName} phải là số nguyên (VNĐ), không được là số thập phân`;
  }

  const num = Number(strPrice);
  if (isNaN(num)) {
    return `${fieldName} phải là chữ số hợp lệ`;
  }

  if (!allowDecimal && !Number.isInteger(num)) {
    return `${fieldName} phải là số nguyên (VNĐ), không được là số thập phân`;
  }

  // 3. Kiểm tra không được là số âm
  if (num < 0) {
    return `${fieldName} không được là số âm`;
  }

  // 4. Kiểm tra lớn hơn 0 nếu không cho phép số 0
  if (!allowZero && num === 0) {
    return `${fieldName} phải lớn hơn 0 ₫`;
  }

  // 5. Kiểm tra theo đơn vị VNĐ là nghìn (bội số của 1.000 ₫, ví dụ: 1.000.000 ₫, không được lẻ như 1.000.232 ₫)
  if (requireThousands && num > 0) {
    if (num < 1000) {
      return `${fieldName} tối thiểu phải từ 1.000 ₫ trở lên`;
    }
    if (num % 1000 !== 0) {
      return `${fieldName} phải tròn theo đơn vị nghìn đồng (VD: 1.000.000 ₫, không được lẻ như 1.000.232 ₫)`;
    }
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

/**
 * Validate biển số xe Việt Nam (VD: 51K-888.99, 30A-12345, 59X1-123.45)
 */
export const VN_LICENSE_PLATE_REGEX = /^[0-9]{2}[A-Z]{1,2}[A-Z0-9]?[-\s.]?[0-9]{3,5}(?:\.[0-9]{2})?$/;

export function validateLicensePlate(
  plate?: string,
  required = true,
  fieldName = 'Biển số xe'
): string | null {
  const trimmed = (plate ?? '').trim().toUpperCase();
  if (!trimmed) {
    return required ? `${fieldName} không được để trống` : null;
  }
  if (!VN_LICENSE_PLATE_REGEX.test(trimmed)) {
    return `${fieldName} không đúng định dạng (VD: 51K-888.99 hoặc 30A-12345)`;
  }
  return null;
}
