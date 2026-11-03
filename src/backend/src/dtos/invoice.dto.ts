import Joi from 'joi';

export const createInvoiceDraftSchema = Joi.object({
  workOrderId: Joi.number().integer().positive().required().messages({
    'number.base': 'Mã phiếu công việc phải là số',
    'number.integer': 'Mã phiếu công việc phải là số nguyên',
    'number.positive': 'Mã phiếu công việc phải lớn hơn 0',
    'any.required': 'Vui lòng cung cấp mã phiếu công việc',
  }),
  notes: Joi.string().allow('', null).max(1000).messages({
    'string.max': 'Ghi chú không được vượt quá 1000 ký tự',
  }),
});

export const updateInvoiceDraftSchema = Joi.object({
  discountAmount: Joi.number().min(0).optional().messages({
    'number.base': 'Số tiền chiết khấu phải là số',
    'number.min': 'Số tiền chiết khấu không được âm',
  }),
  discountPercent: Joi.number().min(0).max(100).optional().messages({
    'number.base': 'Tỷ lệ chiết khấu phải là số',
    'number.min': 'Tỷ lệ chiết khấu không được âm',
    'number.max': 'Tỷ lệ chiết khấu không được vượt quá 100%',
  }),
  discountReason: Joi.string().trim().min(3).max(500).allow('', null).messages({
    'string.min': 'Lý do chiết khấu phải có ít nhất 3 ký tự',
    'string.max': 'Lý do chiết khấu không được vượt quá 500 ký tự',
  }),
  notes: Joi.string().allow('', null).max(1000).messages({
    'string.max': 'Ghi chú không được vượt quá 1000 ký tự',
  }),
}).custom((value, helpers) => {
  const hasDiscount =
    (value.discountAmount !== undefined && value.discountAmount > 0) ||
    (value.discountPercent !== undefined && value.discountPercent > 0);

  if (hasDiscount && (!value.discountReason || value.discountReason.trim().length < 3)) {
    return helpers.message({
      custom: 'Bắt buộc nhập lý do chiết khấu (tối thiểu 3 ký tự) khi thay đổi mức giảm giá',
    });
  }
  return value;
});

export const cancelInvoiceSchema = Joi.object({
  reason: Joi.string().trim().min(3).max(500).required().messages({
    'any.required': 'Vui lòng nhập lý do hủy hóa đơn',
    'string.empty': 'Lý do hủy hóa đơn không được để trống',
    'string.min': 'Lý do hủy phải có ít nhất 3 ký tự',
    'string.max': 'Lý do hủy không được vượt quá 500 ký tự',
  }),
});

export const recordManualPaymentSchema = Joi.object({
  paymentMethod: Joi.string().valid('CASH', 'CARD').required().messages({
    'any.required': 'Vui lòng chọn phương thức thanh toán',
    'any.only': 'Phương thức thanh toán thủ công phải là CASH (Tiền mặt) hoặc CARD (Thẻ)',
  }),
  amount: Joi.number().positive().required().messages({
    'any.required': 'Vui lòng nhập số tiền thanh toán',
    'number.base': 'Số tiền thanh toán phải là số',
    'number.positive': 'Số tiền thanh toán phải lớn hơn 0',
  }),
  tenderedAmount: Joi.number().min(0).optional().messages({
    'number.base': 'Số tiền khách đưa phải là số',
    'number.min': 'Số tiền khách đưa không được âm',
  }),
  transactionRef: Joi.string().trim().max(255).allow('', null).messages({
    'string.max': 'Mã giao dịch/chuẩn chi không được vượt quá 255 ký tự',
  }),
});

export const billingQueueQuerySchema = Joi.object({
  tab: Joi.string().valid('PENDING', 'DRAFT', 'ISSUED', 'PAID', 'ALL').default('PENDING'),
  search: Joi.string().allow('', null).trim(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
