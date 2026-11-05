import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  getPaymentStatus,
  cancelPendingPayment,
  simulateQrSuccess,
  handleSepayIpn,
} from '../controllers/payment.controller';

const router = Router();

// ========================================================
// PUBLIC WEBHOOK / IPN (Xác thực bằng X-Secret-Key hoặc API Key)
// ========================================================
router.get('/sepay/ipn', (req, res) => {
  res.status(200).json({ success: true, message: 'SePay Webhook endpoint is active' });
});
router.post('/sepay/ipn', handleSepayIpn);

// ========================================================
// CÁC ROUTE YÊU CẦU XÁC THỰC NGƯỜI DÙNG (JWT AUTH)
// ========================================================
router.use(authenticate);

// Tra cứu trạng thái giao dịch thanh toán
router.get('/:id/status', authorize('DESK STAFF', 'ADMIN', 'CUSTOMER'), getPaymentStatus);

// Hủy giao dịch thanh toán đang ở trạng thái PENDING
router.post('/:id/cancel', authorize('DESK STAFF', 'ADMIN', 'CUSTOMER'), cancelPendingPayment);

// Giả lập thanh toán thành công (dành cho môi trường Test / Dev)
router.post('/:id/simulate-success', authorize('DESK STAFF', 'ADMIN', 'CUSTOMER'), simulateQrSuccess);

export default router;

