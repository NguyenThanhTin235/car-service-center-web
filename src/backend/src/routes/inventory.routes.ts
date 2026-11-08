import { Router } from 'express';
import {
  getItems, getItemById, createItem, updateItem, toggleItem, getItemMovements,
  getReceipts, getReceiptById, createReceipt, postDraftReceipt, cancelReceipt,
  getSuppliers, createSupplier, updateSupplier,
  getCategories, getCategoryById, createCategory, updateCategory, toggleCategory,
  getBrands, getUoms,
} from '../controllers/inventory.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Part Categories (Master)
router.get('/part-categories', authenticate, authorize('MANAGER', 'ADVISOR', 'SA', 'ADMIN'), getCategories);
router.get('/part-categories/:id', authenticate, authorize('MANAGER', 'ADVISOR', 'SA', 'ADMIN'), getCategoryById);
router.post('/part-categories', authenticate, authorize('MANAGER', 'ADMIN'), createCategory);
router.put('/part-categories/:id', authenticate, authorize('MANAGER', 'ADMIN'), updateCategory);
router.patch('/part-categories/:id/toggle', authenticate, authorize('MANAGER', 'ADMIN'), toggleCategory);

// Inventory Items (Variants)
router.get('/inventory-items', authenticate, authorize('MANAGER', 'ADVISOR', 'SA', 'ADMIN'), getItems);
router.get('/inventory-items/:id', authenticate, authorize('MANAGER', 'ADVISOR', 'SA', 'ADMIN'), getItemById);
router.get('/inventory-items/:id/movements', authenticate, authorize('MANAGER', 'ADVISOR', 'SA', 'ADMIN'), getItemMovements);
router.post('/inventory-items', authenticate, authorize('MANAGER', 'ADMIN'), createItem);
router.put('/inventory-items/:id', authenticate, authorize('MANAGER', 'ADMIN'), updateItem);
router.patch('/inventory-items/:id/toggle', authenticate, authorize('MANAGER', 'ADMIN'), toggleItem);

// Lookups
router.get('/inventory/brands', authenticate, authorize('MANAGER', 'ADVISOR', 'SA', 'ADMIN'), getBrands);
router.get('/inventory/uoms', authenticate, authorize('MANAGER', 'ADVISOR', 'SA', 'ADMIN'), getUoms);

// Goods Receipts
router.get('/inventory/receipts', authenticate, authorize('MANAGER', 'ADMIN'), getReceipts);
router.get('/inventory/receipts/:id', authenticate, authorize('MANAGER', 'ADMIN'), getReceiptById);
router.post('/inventory/receipts', authenticate, authorize('MANAGER', 'ADMIN'), createReceipt);
router.post('/inventory/receipts/:id/post', authenticate, authorize('MANAGER', 'ADMIN'), postDraftReceipt);
router.post('/inventory/receipts/:id/cancel', authenticate, authorize('MANAGER', 'ADMIN'), cancelReceipt);

// Suppliers
router.get('/inventory/suppliers', authenticate, authorize('MANAGER', 'ADMIN'), getSuppliers);
router.post('/inventory/suppliers', authenticate, authorize('MANAGER', 'ADMIN'), createSupplier);
router.put('/inventory/suppliers/:id', authenticate, authorize('MANAGER', 'ADMIN'), updateSupplier);

export default router;
