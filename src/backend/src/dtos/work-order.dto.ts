import Joi from 'joi';

/**
 * Schema validate cho việc tạo Work Order từ Intake Record
 */
export const createWorkOrderSchema = Joi.object({
  intakeRecordId: Joi.number().integer().positive().required().messages({
    'number.base': 'Mã phiếu tiếp nhận phải là số',
    'number.integer': 'Mã phiếu tiếp nhận phải là số nguyên',
    'number.positive': 'Mã phiếu tiếp nhận phải lớn hơn 0',
    'any.required': 'Vui lòng chọn phiếu tiếp nhận',
  }),
});


/**
 * Schema validate cho việc đóng hồ sơ Work Order
 */
export const closeWorkOrderSchema = Joi.object({
  notes: Joi.string().allow('', null).max(1000).messages({
    'string.max': 'Ghi chú đóng hồ sơ tối đa 1000 ký tự',
  }),
});
