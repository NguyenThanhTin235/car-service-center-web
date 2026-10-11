import { Router } from 'express';
import {
  getItems, getItemById, createItem, updateItem, toggleItem,
  getReceipts, createReceipt, getSuppliers,
  getCategories, getCategoryById, createCategory, updateCategory, toggleCategory,
  getBrands, getUoms,
} from '../controllers/inventory.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Part Categories (Master)
router.get('/part-categories', authenticate, authorize('MANAGER', 'ADVISOR', 'ADMIN'), getCategories);
router.get('/part-categories/:id', authenticate, authorize('MANAGER', 'ADVISOR', 'ADMIN'), getCategoryById);
router.post('/part-categories', authenticate, authorize('MANAGER', 'ADMIN'), createCategory);
router.put('/part-categories/:id', authenticate, authorize('MANAGER', 'ADMIN'), updateCategory);
router.patch('/part-categories/:id/toggle', authenticate, authorize('MANAGER', 'ADMIN'), toggleCategory);

// Inventory Items (Variants)
router.get('/inventory-items', authenticate, authorize('MANAGER', 'ADVISOR', 'ADMIN'), getItems);
router.get('/inventory-items/:id', authenticate, authorize('MANAGER', 'ADVISOR', 'ADMIN'), getItemById);
router.post('/inventory-items', authenticate, authorize('MANAGER', 'ADMIN'), createItem);
router.put('/inventory-items/:id', authenticate, authorize('MANAGER', 'ADMIN'), updateItem);
router.patch('/inventory-items/:id/toggle', authenticate, authorize('MANAGER', 'ADMIN'), toggleItem);

// Lookups
router.get('/inventory/brands', authenticate, authorize('MANAGER', 'ADVISOR', 'ADMIN'), getBrands);
router.get('/inventory/uoms', authenticate, authorize('MANAGER', 'ADVISOR', 'ADMIN'), getUoms);

// Goods Receipts
router.get('/inventory/receipts', authenticate, authorize('MANAGER', 'ADMIN'), getReceipts);
router.post('/inventory/receipts', authenticate, authorize('MANAGER', 'ADMIN'), createReceipt);

// Suppliers
router.get('/inventory/suppliers', authenticate, authorize('MANAGER', 'ADMIN'), getSuppliers);

export default router;
