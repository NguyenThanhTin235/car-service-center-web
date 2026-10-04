import Joi from 'joi';

/**
 * Schema validate cho việc thêm dịch vụ vào Work Order (UC-31)
 */
export const addWoServiceSchema = Joi.object({
  serviceId: Joi.number().integer().positive().required().messages({
    'number.base': 'Mã dịch vụ phải là số',
    'number.integer': 'Mã dịch vụ phải là số nguyên',
    'number.positive': 'Mã dịch vụ phải lớn hơn 0',
    'any.required': 'Vui lòng chọn dịch vụ từ danh mục',
  }),
});
