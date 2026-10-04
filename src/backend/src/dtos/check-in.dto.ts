import Joi from 'joi';

export const createCheckInSchema = Joi.object({
  mileage: Joi.number().integer().min(0).required().messages({
    'number.base': 'Số km phải là số',
    'number.integer': 'Số km phải là số nguyên',
    'number.min': 'Số km không được âm',
    'any.required': 'Vui lòng nhập số km hiện tại',
  }),
  fuel_level: Joi.string()
    .valid('EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTER', 'FULL')
    .required()
    .messages({
      'any.only': 'Mức nhiên liệu không hợp lệ',
      'any.required': 'Vui lòng chọn mức nhiên liệu',
    }),
  complaint: Joi.string().trim().required().messages({
    'string.empty': 'Vui lòng nhập nội dung phàn nàn/yêu cầu',
    'any.required': 'Nội dung phàn nàn/yêu cầu là bắt buộc',
  }),
  exterior_condition: Joi.string().trim().required().messages({
    'string.empty': 'Vui lòng nhập tình trạng xe quan sát được',
    'any.required': 'Tình trạng ngoại thất là bắt buộc',
  }),
  belongings: Joi.string().allow('', null).optional(),
  evidence_urls: Joi.array().items(Joi.string().uri()).optional().messages({
    'array.includes': 'URL hình ảnh minh chứng không hợp lệ',
  }),
});

export const updateCheckInSchema = createCheckInSchema.fork(
  ['mileage', 'fuel_level', 'complaint', 'exterior_condition'],
  (schema) => schema.optional()
);
