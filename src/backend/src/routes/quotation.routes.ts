import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  getQuotationsByWorkOrder,
  getQuotationById,
  createQuotation,
  updateQuotation,
  sendQuotation,
  approveQuotation,
  rejectQuotation,
  cancelQuotation,
  exportQuotationPdf,
} from '../controllers/quotation.controller';

const router = Router();

// Toàn bộ API báo giá yêu cầu xác thực người dùng
router.use(authenticate);

// 1. Quản lý báo giá theo Phiếu công việc (Work Order)
router.get(
  '/work-orders/:workOrderId',
  authorize('SA', 'ADMIN', 'DESK STAFF', 'CUSTOMER'),
  getQuotationsByWorkOrder
);
router.post(
  '/work-orders/:workOrderId',
  authorize('SA', 'ADMIN'),
  createQuotation
);

// 2. Thao tác trên từng Báo giá cụ thể
router.get(
  '/:id',
  authorize('SA', 'ADMIN', 'DESK STAFF', 'CUSTOMER'),
  getQuotationById
);
router.patch(
  '/:id',
  authorize('SA', 'ADMIN'),
  updateQuotation
);
router.post(
  '/:id/send',
  authorize('SA', 'ADMIN'),
  sendQuotation
);
router.post(
  '/:id/approve',
  authorize('SA', 'ADMIN', 'CUSTOMER'),
  approveQuotation
);
router.post(
  '/:id/reject',
  authorize('SA', 'ADMIN', 'CUSTOMER'),
  rejectQuotation
);
router.post(
  '/:id/cancel',
  authorize('SA', 'ADMIN'),
  cancelQuotation
);
router.get(
  '/:id/pdf',
  authorize('SA', 'ADMIN', 'DESK STAFF', 'CUSTOMER'),
  exportQuotationPdf
);

export default router;
