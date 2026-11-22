import Joi from 'joi';

// Chỉ cho phép chữ cái (bao gồm tiếng Việt có dấu) và khoảng trắng
export const FULL_NAME_REGEX = /^[\p{L}\s]+$/u;
export const FULL_NAME_INVALID_MSG = 'Vui lòng nhập họ và tên hợp lệ, không nhập số hoặc ký tự đặc biệt.';

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Vui lòng nhập email',
    'string.email': 'Email không hợp lệ',
    'any.required': 'Vui lòng nhập email',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Vui lòng nhập mật khẩu',
    'any.required': 'Vui lòng nhập mật khẩu',
  }),
});

export const sendOtpRegisterSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(150).pattern(FULL_NAME_REGEX).required().messages({
    'string.empty': 'Vui lòng nhập họ và tên',
    'string.min': 'Họ và tên phải có ít nhất 2 ký tự',
    'string.max': 'Họ và tên không được vượt quá 150 ký tự',
    'string.pattern.base': FULL_NAME_INVALID_MSG,
    'any.required': 'Vui lòng nhập họ và tên',
  }),
  phone: Joi.string()
    .pattern(/^(0|\+84)[3-9]\d{8}$/)
    .required()
    .messages({
      'string.empty': 'Vui lòng nhập số điện thoại',
      'string.pattern.base': 'Số điện thoại không hợp lệ',
      'any.required': 'Vui lòng nhập số điện thoại',
    }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Vui lòng nhập email',
    'string.email': 'Email không hợp lệ',
    'any.required': 'Vui lòng nhập email',
  }),
  password: Joi.string().min(8).required().messages({
    'string.empty': 'Vui lòng nhập mật khẩu',
    'string.min': 'Mật khẩu phải có ít nhất 8 ký tự',
    'any.required': 'Vui lòng nhập mật khẩu',
  }),
});

export const verifyOtpRegisterSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Vui lòng nhập email',
    'string.email': 'Email không hợp lệ',
    'any.required': 'Vui lòng nhập email',
  }),
  otp: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    'string.empty': 'Vui lòng nhập mã OTP',
    'string.length': 'Mã OTP phải có 6 chữ số',
    'string.pattern.base': 'Mã OTP chỉ gồm chữ số',
    'any.required': 'Vui lòng nhập mã OTP',
  }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Vui lòng nhập email',
    'string.email': 'Email không hợp lệ',
    'any.required': 'Vui lòng nhập email',
  }),
});

export const verifyOtpResetSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Vui lòng nhập email',
    'string.email': 'Email không hợp lệ',
    'any.required': 'Vui lòng nhập email',
  }),
  otp: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    'string.empty': 'Vui lòng nhập mã OTP',
    'string.length': 'Mã OTP phải có 6 chữ số',
    'string.pattern.base': 'Mã OTP chỉ gồm chữ số',
    'any.required': 'Vui lòng nhập mã OTP',
  }),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Vui lòng nhập email',
    'string.email': 'Email không hợp lệ',
    'any.required': 'Vui lòng nhập email',
  }),
  otp: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    'string.empty': 'Vui lòng nhập mã OTP',
    'string.length': 'Mã OTP phải có 6 chữ số',
    'any.required': 'Vui lòng nhập mã OTP',
  }),
  newPassword: Joi.string().min(8).required().messages({
    'string.empty': 'Vui lòng nhập mật khẩu mới',
    'string.min': 'Mật khẩu mới phải có ít nhất 8 ký tự',
    'any.required': 'Vui lòng nhập mật khẩu mới',
  }),
});

export const updateMeSchema = Joi.object({
  // Quy tắc ký tự hợp lệ (FULL_NAME_REGEX) được kiểm tra ở controller khi họ tên thực sự thay đổi
  fullName: Joi.string().trim().min(2).max(150).messages({
    'string.empty': 'Vui lòng nhập họ và tên',
    'string.min': 'Họ và tên phải có ít nhất 2 ký tự',
    'string.max': 'Họ và tên không được vượt quá 150 ký tự',
  }),
  phone: Joi.string()
    .trim()
    .pattern(/^(0|\+84)[3-9]\d{8}$/)
    .allow('', null)
    .messages({
      'string.pattern.base': 'Số điện thoại không đúng định dạng Việt Nam (VD: 0901234567)',
    }),
  email: Joi.string().trim().email().messages({
    'string.email': 'Email không hợp lệ',
  }),
  address: Joi.string().trim().max(500).allow('', null).messages({
    'string.max': 'Địa chỉ không được vượt quá 500 ký tự',
  }),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Vui lòng nhập mật khẩu hiện tại',
    'any.required': 'Vui lòng nhập mật khẩu hiện tại',
  }),
  newPassword: Joi.string().min(8).max(100).required().messages({
    'string.empty': 'Vui lòng nhập mật khẩu mới',
    'string.min': 'Mật khẩu mới phải có ít nhất 8 ký tự',
    'string.max': 'Mật khẩu mới không được vượt quá 100 ký tự',
    'any.required': 'Vui lòng nhập mật khẩu mới',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Mật khẩu xác nhận không khớp',
    'string.empty': 'Vui lòng xác nhận mật khẩu mới',
    'any.required': 'Vui lòng xác nhận mật khẩu mới',
  }),
});
