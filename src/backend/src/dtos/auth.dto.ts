import Joi from 'joi';

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
  fullName: Joi.string().min(2).max(150).required().messages({
    'string.empty': 'Vui lòng nhập họ và tên',
    'string.min': 'Họ và tên phải có ít nhất 2 ký tự',
    'string.max': 'Họ và tên không được vượt quá 150 ký tự',
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
