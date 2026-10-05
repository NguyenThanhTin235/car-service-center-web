import Joi from 'joi';

export const createInventoryItemSchema = Joi.object({
  sku: Joi.string().max(50).required(),
  name: Joi.string().max(255).required(),
  itemType: Joi.string().valid('PART', 'CONSUMABLE', 'CHEMICAL', 'ACCESSORY').required(),
  uomId: Joi.number().required(),
  sellingPrice: Joi.number().min(0).required(),
  reorderLevel: Joi.number().min(0).default(0)
});

export const updateInventoryItemSchema = Joi.object({
  sku: Joi.string().max(50).optional(),
  name: Joi.string().max(255).optional(),
  itemType: Joi.string().valid('PART', 'CONSUMABLE', 'CHEMICAL', 'ACCESSORY').optional(),
  uomId: Joi.number().optional(),
  sellingPrice: Joi.number().min(0).optional(),
  reorderLevel: Joi.number().min(0).optional(),
  isActive: Joi.boolean().optional()
});

export const createGoodsReceiptSchema = Joi.object({
  supplierId: Joi.number().optional().allow(null),
  receiptType: Joi.string().valid('PURCHASE', 'OPENING_STOCK').required(),
  referenceNo: Joi.string().max(100).optional().allow(''),
  receivedDate: Joi.date().iso().required(),
  notes: Joi.string().optional().allow(''),
  items: Joi.array().items(
    Joi.object({
      itemId: Joi.number().required(),
      quantity: Joi.number().greater(0).required(),
      unitCost: Joi.number().min(0).required()
    })
  ).min(1).required()
});
