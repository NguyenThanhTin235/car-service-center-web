import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  getIntakeQueueForAdvisor,
  getWorkOrders,
  createWorkOrder,
  getWorkOrderById,
  updateWorkOrder
} from '../controllers/work-order.controller';

const router = Router();

// Tất cả route yêu cầu đăng nhập
router.use(authenticate);

// Lấy danh sách hàng đợi tiếp nhận (cho Advisor tạo WO)
router.get('/intake-queue', authorize('SA'), getIntakeQueueForAdvisor);

// Lấy danh sách phiếu công việc
router.get('/', authorize('SA', 'DESK STAFF'), getWorkOrders);

// Tạo phiếu công việc từ phiếu tiếp nhận
router.post('/', authorize('SA'), createWorkOrder);

// Lấy chi tiết phiếu công việc
router.get('/:id', authorize('SA', 'DESK STAFF'), getWorkOrderById);

// Cập nhật thông tin phiếu công việc (UC-29)
router.put('/:id', authorize('SA'), updateWorkOrder);

export default router;
