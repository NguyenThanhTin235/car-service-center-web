import Joi from 'joi';

export const createFindingSchema = Joi.object({
  marker_type: Joi.string()
    .valid('DAMAGE', 'RUST', 'DENT', 'SCRATCH', 'MISSING', 'OTHER')
    .required()
    .messages({
      'any.only': 'Loại marker không hợp lệ (DAMAGE, RUST, DENT, SCRATCH, MISSING, OTHER)',
      'any.required': 'Loại marker là bắt buộc',
    }),
  part_id: Joi.string().required().messages({
    'any.required': 'Mã bộ phận (part_id) là bắt buộc',
  }),
  part_name: Joi.string().required().messages({
    'any.required': 'Tên bộ phận (part_name) là bắt buộc',
  }),
  coordinates: Joi.object({
    x: Joi.number().required(),
    y: Joi.number().required(),
    part_id: Joi.string().optional(),
  })
    .required()
    .messages({
      'any.required': 'Tọa độ marker trên sơ đồ xe là bắt buộc',
    }),
  description: Joi.string().allow('', null).optional(),
  severity: Joi.string()
    .valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    .optional()
    .default('MEDIUM')
    .messages({
      'any.only': 'Mức độ nghiêm trọng không hợp lệ (LOW, MEDIUM, HIGH, CRITICAL)',
    }),
  evidence_urls: Joi.array().items(Joi.string().uri()).optional().default([]),
  recommendation: Joi.string().allow('', null).optional(),
  is_visible_to_customer: Joi.boolean().optional().default(true),
});

export const updateFindingSchema = Joi.object({
  description: Joi.string().allow('', null).optional(),
  severity: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').optional(),
  evidence_urls: Joi.array().items(Joi.string().uri()).optional(),
  recommendation: Joi.string().allow('', null).optional(),
  is_visible_to_customer: Joi.boolean().optional(),
  job_id: Joi.number().allow(null).optional(),
});
