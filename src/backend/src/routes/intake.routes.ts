import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  getIntakeQueue,
  getIntakeById,
  createIntake,
  cancelIntake,
} from '../controllers/intake.controller';

const router = Router();

// Tất cả route đều yêu cầu đăng nhập + quyền DESK STAFF hoặc ADMIN
router.use(authenticate, authorize('DESK STAFF', 'ADMIN'));

// Lấy danh sách hàng đợi
router.get('/', getIntakeQueue);

// Chi tiết phiếu tiếp nhận
router.get('/:id', getIntakeById);

// Tạo phiếu Walk-in / Tow-in
router.post('/', createIntake);

// Hủy phiếu tiếp nhận
router.patch('/:id/cancel', cancelIntake);

export default router;
