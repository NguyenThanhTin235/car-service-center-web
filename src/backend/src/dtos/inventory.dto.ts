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
  sku: Joi.string().max(50).required(),
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
  referenceNo: Joi.string().max(100).optional().allow(''),
  receivedDate: Joi.date().iso().required(),
  notes: Joi.string().optional().allow(''),
  items: Joi.array().items(
    Joi.object({
      itemId: Joi.number().required(),
      quantity: Joi.number().integer().greater(0).required(),
      unitCost: Joi.number().min(0).required()
    })
  ).min(1).required()
});
