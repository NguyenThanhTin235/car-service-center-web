import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  getIntakeQueue,
  getIntakeById,
  createIntake,
  cancelIntake,
} from '../controllers/intake.controller';

const router = Router();

// Tất cả route tiếp nhận yêu cầu đăng nhập và thuộc nhóm nhân viên vận hành xưởng
router.use(authenticate, authorize('DESK STAFF', 'SA', 'ADVISOR', 'MANAGER', 'ADMIN'));

// Lấy danh sách hàng đợi
router.get('/', getIntakeQueue);

// Chi tiết phiếu tiếp nhận
router.get('/:id', getIntakeById);

// Tạo phiếu Walk-in / Tow-in
router.post('/', createIntake);

// Hủy phiếu tiếp nhận
router.patch('/:id/cancel', cancelIntake);

export default router;
