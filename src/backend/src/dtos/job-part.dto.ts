import Joi from 'joi';

/**
 * Schema validate cho việc thêm phụ tùng / vật tư vào Job (UC-36)
 */
export const addJobPartSchema = Joi.object({
  item_id: Joi.number().integer().positive().required().messages({
    'number.base': 'Mã phụ tùng phải là số',
    'number.integer': 'Mã phụ tùng phải là số nguyên',
    'number.positive': 'Mã phụ tùng phải lớn hơn 0',
    'any.required': 'Vui lòng chọn phụ tùng từ kho',
  }),
  planned_quantity: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Số lượng dự kiến phải là số',
    'number.positive': 'Số lượng dự kiến phải lớn hơn 0',
    'any.required': 'Vui lòng nhập số lượng dự kiến',
  }),
  unit_price: Joi.number().min(0).precision(2).optional().messages({
    'number.base': 'Đơn giá phải là số',
    'number.min': 'Đơn giá không được âm',
  }),
});

/**
 * Schema validate cho việc cập nhật phụ tùng trong Job (UC-36)
 */
export const updateJobPartSchema = Joi.object({
  planned_quantity: Joi.number().positive().precision(2).optional().messages({
    'number.base': 'Số lượng dự kiến phải là số',
    'number.positive': 'Số lượng dự kiến phải lớn hơn 0',
  }),
  unit_price: Joi.number().min(0).precision(2).optional().messages({
    'number.base': 'Đơn giá phải là số',
    'number.min': 'Đơn giá không được âm',
  }),
  status: Joi.string().valid('PLANNED', 'RESERVED', 'ISSUED', 'USED', 'RETURNED').optional().messages({
    'any.only': 'Trạng thái cấp phát không hợp lệ',
  }),
});
