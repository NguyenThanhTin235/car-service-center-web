import { Request, Response } from 'express';
import { inventoryService } from '../services/inventory.service';
import {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  createGoodsReceiptSchema,
  createPartCategorySchema,
  updatePartCategorySchema,
} from '../dtos/inventory.dto';

// ==========================================
// PART CATEGORIES
// ==========================================
export const getCategories = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const itemType = req.query.itemType as any;

    const result = await inventoryService.getCategories(search, itemType, page, limit);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const result = await inventoryService.getCategoryById(id);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { error, value } = createPartCategorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const result = await inventoryService.createCategory(value);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { error, value } = updatePartCategorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const result = await inventoryService.updateCategory(id, value);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const toggleCategory = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const result = await inventoryService.toggleCategory(id);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getBrands = async (_req: Request, res: Response) => {
  try {
    const result = await inventoryService.getBrands();
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getUoms = async (_req: Request, res: Response) => {
  try {
    const result = await inventoryService.getUoms();
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==========================================
// INVENTORY ITEMS (Variants)
// ==========================================
export const getItems = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const itemType = req.query.itemType as any;
    const partCategoryId = parseInt(req.query.partCategoryId as string) || undefined;
    const brandId = parseInt(req.query.brandId as string) || undefined;

    const result = await inventoryService.getItems(search, itemType, page, limit, partCategoryId, brandId);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getItemById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const result = await inventoryService.getItemById(id);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const createItem = async (req: Request, res: Response) => {
  try {
    const { error, value } = createInventoryItemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const result = await inventoryService.createItem(value);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { error, value } = updateInventoryItemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const result = await inventoryService.updateItem(id, value);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const toggleItem = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const result = await inventoryService.toggleItem(id);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getReceipts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await inventoryService.getReceipts(page, limit);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createReceipt = async (req: Request, res: Response) => {
  try {
    const { error, value } = createGoodsReceiptSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const createdById = (req as any).user?.id || 1;
    const result = await inventoryService.createReceipt(value, createdById);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSuppliers = async (req: Request, res: Response) => {
  try {
    const result = await inventoryService.getSuppliers();
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
