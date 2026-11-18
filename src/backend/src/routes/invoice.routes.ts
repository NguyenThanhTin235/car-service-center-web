import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  getMyInvoices,
  getBillingQueue,
  previewInvoice,
  createInvoiceDraft,
  updateInvoiceDraft,
  issueInvoice,
  cancelInvoice,
  getInvoiceById,
  downloadInvoicePdf,
} from '../controllers/invoice.controller';
import {
  recordManualPayment,
  createSepayPayment,
  getInvoicePaymentStatus,
} from '../controllers/payment.controller';

const router = Router();

// Tất cả các route yêu cầu người dùng đã đăng nhập
router.use(authenticate);

// UC-16: Danh sách hóa đơn của khách hàng đang đăng nhập
router.get('/my-invoices', authorize('CUSTOMER'), getMyInvoices);

// UC-27: Hàng chờ lập hóa đơn và quản lý hóa đơn (Desk Staff, Admin, Manager)
router.get('/billing-queue', authorize('DESK STAFF', 'ADMIN', 'MANAGER'), getBillingQueue);

// UC-27: Xem trước bảng kê chi phí và các dòng hóa đơn dự kiến trước khi tạo nháp
router.get('/preview', authorize('DESK STAFF', 'ADMIN'), previewInvoice);

// UC-27: Tạo hóa đơn nháp từ Work Order đã được gửi Billing Request
router.post('/', authorize('DESK STAFF', 'ADMIN'), createInvoiceDraft);

// UC-27: Cập nhật chiết khấu & ghi chú cho hóa đơn nháp
router.patch('/:id', authorize('DESK STAFF', 'ADMIN'), updateInvoiceDraft);

// UC-27: Phát hành hóa đơn chính thức cho khách hàng
router.post('/:id/issue', authorize('DESK STAFF', 'ADMIN'), issueInvoice);

// UC-27: Hủy hóa đơn
router.post('/:id/cancel', authorize('DESK STAFF', 'MANAGER', 'ADMIN'), cancelInvoice);

// UC-28: Ghi nhận thanh toán thủ công (Tiền mặt / Thẻ ngân hàng)
router.post('/:id/payments', authorize('DESK STAFF', 'ADMIN'), recordManualPayment);

// UC-28: Khởi tạo phiên thanh toán SePay (Khách hàng hoặc Desk Staff/Admin)
router.post('/:id/payments/sepay', authorize('CUSTOMER', 'DESK STAFF', 'ADMIN', 'MANAGER'), createSepayPayment);

// Tra cứu trạng thái thanh toán của hóa đơn
router.get('/:id/payments/status', authorize('CUSTOMER', 'DESK STAFF', 'ADMIN', 'MANAGER', 'SA'), getInvoicePaymentStatus);

// UC-27 / UC-16 / FR-18: Tải file hóa đơn dịch vụ định dạng PDF
router.get('/:id/pdf', authorize('CUSTOMER', 'SA', 'ADMIN', 'DESK STAFF', 'MANAGER'), downloadInvoicePdf);

// UC-16 / UC-27: Xem chi tiết hóa đơn (kèm kiểm tra quyền sở hữu đối với CUSTOMER)
router.get('/:id', authorize('CUSTOMER', 'SA', 'ADMIN', 'DESK STAFF', 'MANAGER'), getInvoiceById);

export default router;
