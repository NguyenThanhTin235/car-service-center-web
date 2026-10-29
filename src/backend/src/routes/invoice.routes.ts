import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { getMyInvoices, getInvoiceById } from '../controllers/invoice.controller';

const router = Router();

// Yêu cầu xác thực cho tất cả các thao tác
router.use(authenticate);

// UC-16: Xem danh sách hóa đơn của khách hàng
router.get('/my-invoices', authorize('CUSTOMER'), getMyInvoices);

// UC-16: Xem chi tiết hóa đơn (Customer xem của mình, SA/Admin/Desk Staff xem toàn hệ thống)
router.get('/:id', authorize('CUSTOMER', 'SA', 'ADMIN', 'DESK STAFF'), getInvoiceById);

export default router;
