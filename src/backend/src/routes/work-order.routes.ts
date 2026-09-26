import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  getIntakeQueueForAdvisor,
  createWorkOrder,
  getWorkOrderById,
  updateWorkOrder
} from '../controllers/work-order.controller';

const router = Router();

// Tất cả route yêu cầu đăng nhập + quyền SA (Cố vấn dịch vụ)
router.use(authenticate, authorize('SA'));

// Lấy danh sách hàng đợi tiếp nhận (cho Advisor tạo WO)
router.get('/intake-queue', getIntakeQueueForAdvisor);

// Tạo phiếu công việc từ phiếu tiếp nhận
router.post('/', createWorkOrder);

// Lấy chi tiết phiếu công việc
router.get('/:id', getWorkOrderById);

// Cập nhật thông tin phiếu công việc (UC-29)
router.put('/:id', updateWorkOrder);

export default router;
