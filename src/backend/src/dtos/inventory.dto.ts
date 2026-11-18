import Joi from 'joi';

const ITEM_TYPES = ['PART', 'CONSUMABLE', 'CHEMICAL', 'ACCESSORY'];

// PartCategory (Master)
export const createPartCategorySchema = Joi.object({
  code: Joi.string().max(50).required(),
  name: Joi.string().max(255).required(),
  itemType: Joi.string().valid(...ITEM_TYPES).required(),
  uomId: Joi.number().required(),
  description: Joi.string().optional().allow('', null),
});

export const updatePartCategorySchema = Joi.object({
  code: Joi.string().max(50).optional(),
  name: Joi.string().max(255).optional(),
  itemType: Joi.string().valid(...ITEM_TYPES).optional(),
  uomId: Joi.number().optional(),
  description: Joi.string().optional().allow('', null),
  isActive: Joi.boolean().optional(),
});

// InventoryItem (Variant)
export const createInventoryItemSchema = Joi.object({
  sku: Joi.string().max(50).optional().allow('', null),
  partCategoryId: Joi.number().required(),
  brandId: Joi.number().optional().allow(null),
  sellingPrice: Joi.number().min(0).required(),
  reorderLevel: Joi.number().integer().min(0).default(0),
});

export const updateInventoryItemSchema = Joi.object({
  sku: Joi.string().max(50).optional(),
  partCategoryId: Joi.number().optional(),
  brandId: Joi.number().optional().allow(null),
  sellingPrice: Joi.number().min(0).optional(),
  reorderLevel: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
});

export const createGoodsReceiptSchema = Joi.object({
  supplierId: Joi.number().optional().allow(null),
  receiptType: Joi.string().valid('PURCHASE', 'OPENING_STOCK').required(),
  status: Joi.string().valid('DRAFT', 'POSTED').default('POSTED'),
  referenceNo: Joi.string().max(100).optional().allow('', null),
  receivedDate: Joi.date().iso().required(),
  taxRate: Joi.number().min(0).max(100).default(0),
  notes: Joi.string().optional().allow('', null),
  items: Joi.array().items(
    Joi.object({
      itemId: Joi.number().required(),
      quantity: Joi.number().integer().greater(0).required(),
      unitCost: Joi.number().min(0).required(),
      discountRate: Joi.number().min(0).max(100).default(0),
      updateSellingPrice: Joi.number().min(0).optional().allow(null),
    })
  ).min(1).required(),
});

export const cancelGoodsReceiptSchema = Joi.object({
  cancelReason: Joi.string().trim().min(3).max(500).required().messages({
    'string.empty': 'Vui lòng nhập lý do hủy phiếu nhập kho',
    'string.min': 'Lý do hủy phiếu phải có ít nhất 3 ký tự',
  }),
});

export const createSupplierSchema = Joi.object({
  code: Joi.string().max(30).optional().allow('', null),
  name: Joi.string().max(255).required(),
  taxCode: Joi.string().max(30).optional().allow('', null),
  contactPerson: Joi.string().max(150).optional().allow('', null),
  phone: Joi.string().max(20).optional().allow('', null),
  email: Joi.string().max(255).optional().allow('', null),
  address: Joi.string().optional().allow('', null),
});

export const updateSupplierSchema = Joi.object({
  code: Joi.string().max(30).optional().allow('', null),
  name: Joi.string().max(255).optional(),
  taxCode: Joi.string().max(30).optional().allow('', null),
  contactPerson: Joi.string().max(150).optional().allow('', null),
  phone: Joi.string().max(20).optional().allow('', null),
  email: Joi.string().max(255).optional().allow('', null),
  address: Joi.string().optional().allow('', null),
  isActive: Joi.boolean().optional(),
});
