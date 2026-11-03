import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  handleVnpayIpn,
  verifyVnpayReturn,
  getPaymentStatus,
  cancelPendingPayment,
  simulateQrSuccess,
} from '../controllers/payment.controller';

const router = Router();

// 1. IPN Webhook từ VNPay (Public - VNPay gọi trực tiếp server-to-server)
router.get('/vnpay/ipn', handleVnpayIpn);

// 2. Các route yêu cầu xác thực người dùng
router.use(authenticate);

// Return URL xác thực kết quả thanh toán khi redirect về từ VNPay
router.get('/vnpay/return', authorize('DESK STAFF', 'ADMIN', 'CUSTOMER'), verifyVnpayReturn);

// Tra cứu trạng thái giao dịch thanh toán
router.get('/:id/status', authorize('DESK STAFF', 'ADMIN', 'CUSTOMER'), getPaymentStatus);

// Hủy giao dịch thanh toán đang ở trạng thái PENDING
router.post('/:id/cancel', authorize('DESK STAFF', 'ADMIN'), cancelPendingPayment);

// Giả lập thanh toán VNPay thành công (chỉ cho Test / Dev)
router.post('/:id/simulate-success', authorize('DESK STAFF', 'ADMIN'), simulateQrSuccess);

export default router;

