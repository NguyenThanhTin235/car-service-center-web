import { Router } from 'express';
import { getItems, getItemById, createItem, updateItem, toggleItem, getReceipts, createReceipt, getSuppliers } from '../controllers/inventory.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Inventory Items
router.get('/inventory-items', authenticate, authorize('MANAGER', 'ADVISOR', 'ADMIN'), getItems);
router.get('/inventory-items/:id', authenticate, authorize('MANAGER', 'ADVISOR', 'ADMIN'), getItemById);
router.post('/inventory-items', authenticate, authorize('MANAGER', 'ADMIN'), createItem);
router.put('/inventory-items/:id', authenticate, authorize('MANAGER', 'ADMIN'), updateItem);
router.patch('/inventory-items/:id/toggle', authenticate, authorize('MANAGER', 'ADMIN'), toggleItem);

// Goods Receipts
router.get('/inventory/receipts', authenticate, authorize('MANAGER', 'ADMIN'), getReceipts);
router.post('/inventory/receipts', authenticate, authorize('MANAGER', 'ADMIN'), createReceipt);

// Suppliers
router.get('/inventory/suppliers', authenticate, authorize('MANAGER', 'ADMIN'), getSuppliers);

export default router;
