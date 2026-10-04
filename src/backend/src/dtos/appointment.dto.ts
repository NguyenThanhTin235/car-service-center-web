import Joi from 'joi';

export const createAppointmentSchema = Joi.object({
  customer_id: Joi.number().required().messages({
    'number.base': 'Mã khách hàng phải là số',
    'any.required': 'Vui lòng chọn khách hàng',
  }),
  vehicle_id: Joi.number().required().messages({
    'number.base': 'Mã xe phải là số',
    'any.required': 'Vui lòng chọn xe',
  }),
  scheduled_date: Joi.date().iso().required().messages({
    'date.base': 'Ngày hẹn không hợp lệ',
    'date.format': 'Định dạng ngày không hợp lệ (ISO)',
    'any.required': 'Vui lòng chọn ngày hẹn',
  }),
  scheduled_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
    'string.pattern.base': 'Giờ hẹn phải theo định dạng HH:mm',
    'any.required': 'Vui lòng chọn giờ hẹn',
  }),
  notes: Joi.string().allow('', null),
  service_ids: Joi.array().items(Joi.number()).optional().messages({
    'array.base': 'Danh sách dịch vụ không hợp lệ',
    'number.base': 'Mã dịch vụ phải là số',
  }),
});

export const updateAppointmentSchema = Joi.object({
  scheduled_date: Joi.date().iso().optional().messages({
    'date.base': 'Ngày hẹn không hợp lệ',
    'date.format': 'Định dạng ngày không hợp lệ (ISO)',
  }),
  scheduled_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().messages({
    'string.pattern.base': 'Giờ hẹn phải theo định dạng HH:mm',
  }),
  notes: Joi.string().allow('', null).optional(),
});

export const cancelAppointmentSchema = Joi.object({
  cancel_reason: Joi.string().required().messages({
    'any.required': 'Vui lòng nhập lý do hủy hẹn',
    'string.empty': 'Lý do hủy hẹn không được để trống',
  }),
});
