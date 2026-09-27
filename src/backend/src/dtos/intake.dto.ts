import Joi from 'joi';

export const createIntakeSchema = Joi.object({
  customerId: Joi.number().integer().when('newCustomer', {
    is: Joi.exist(),
    then: Joi.optional().allow(null, 0),
    otherwise: Joi.required(),
  }).messages({
    'number.base': 'Mã khách hàng phải là số',
    'any.required': 'Vui lòng chọn khách hàng hoặc tạo mới',
  }),

  vehicleId: Joi.number().integer().when('newVehicle', {
    is: Joi.exist(),
    then: Joi.optional().allow(null, 0),
    otherwise: Joi.required(),
  }).messages({
    'number.base': 'Mã xe phải là số',
    'any.required': 'Vui lòng chọn xe hoặc tạo mới',
  }),

  intakeType: Joi.string().valid('WALK_IN', 'TOW_IN').required().messages({
    'any.only': 'Loại tiếp nhận phải là WALK_IN hoặc TOW_IN',
    'any.required': 'Vui lòng chọn loại tiếp nhận',
  }),

  arrivedAt: Joi.date().iso().required().messages({
    'date.base': 'Thời gian đến không hợp lệ',
    'any.required': 'Vui lòng nhập thời điểm đến',
  }),

  towCompany: Joi.string().max(255).when('intakeType', {
    is: 'TOW_IN',
    then: Joi.required().messages({
      'any.required': 'Vui lòng nhập tên người/đơn vị bàn giao xe',
      'string.empty': 'Tên đơn vị bàn giao không được để trống',
    }),
    otherwise: Joi.optional().allow('', null),
  }),

  notes: Joi.string().allow('', null).optional(),

  serviceTemplateIds: Joi.array().items(Joi.number().integer()).optional().messages({
    'array.base': 'Danh sách dịch vụ không hợp lệ',
    'number.base': 'ID dịch vụ phải là số',
  }),

  // Quick-create customer
  newCustomer: Joi.object({
    fullName: Joi.string().max(150).required().messages({
      'any.required': 'Vui lòng nhập tên khách hàng',
      'string.empty': 'Tên khách hàng không được để trống',
    }),
    phone: Joi.string().max(20).required().messages({
      'any.required': 'Vui lòng nhập số điện thoại',
      'string.empty': 'Số điện thoại không được để trống',
    }),
    email: Joi.string().email().allow('', null).optional(),
    address: Joi.string().allow('', null).optional(),
  }).optional().allow(null),

  // Quick-create vehicle
  newVehicle: Joi.object({
    licensePlate: Joi.string().max(20).required().messages({
      'any.required': 'Vui lòng nhập biển số xe',
      'string.empty': 'Biển số xe không được để trống',
    }),
    make: Joi.string().max(100).required().messages({
      'any.required': 'Vui lòng nhập hãng xe',
      'string.empty': 'Hãng xe không được để trống',
    }),
    model: Joi.string().max(100).required().messages({
      'any.required': 'Vui lòng nhập dòng xe',
      'string.empty': 'Dòng xe không được để trống',
    }),
    year: Joi.number().integer().min(1900).max(2100).optional(),
    color: Joi.string().max(50).allow('', null).optional(),
    vehicleSize: Joi.string().valid('SMALL', 'MEDIUM', 'LARGE', 'SUV', 'TRUCK').optional(),
  }).optional().allow(null),
});
