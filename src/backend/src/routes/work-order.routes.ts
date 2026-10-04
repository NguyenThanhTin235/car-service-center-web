import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  getIntakeQueueForAdvisor,
  getWorkOrders,
  createWorkOrder,
  getWorkOrderById,
  updateWorkOrder,
  addServiceToWO,
  removeServiceFromWO
} from '../controllers/work-order.controller';
import { CheckInController } from '../controllers/check-in.controller';

const router = Router();

// Yêu cầu đăng nhập cho toàn bộ
router.use(authenticate);

// Lấy danh sách hàng đợi tiếp nhận (cho Advisor tạo WO)
router.get('/intake-queue', authorize('SA', 'ADMIN'), getIntakeQueueForAdvisor);

// Lấy danh sách phiếu công việc
router.get('/', authorize('SA', 'ADMIN'), getWorkOrders);

// Tạo phiếu công việc từ phiếu tiếp nhận
router.post('/', authorize('SA', 'ADMIN'), createWorkOrder);

// Lấy chi tiết phiếu công việc (Cả SA và Desk Staff đều được xem)
router.get('/:id', authorize('SA', 'DESK STAFF', 'ADMIN'), getWorkOrderById);

// Cập nhật thông tin phiếu công việc (UC-29)
router.put('/:id', authorize('SA', 'ADMIN'), updateWorkOrder);

// TÌNH TRẠNG XE LÚC TIẾP NHẬN (UC-30)
router.post('/:id/check-in', authorize('SA', 'ADMIN'), CheckInController.createOrUpdateCheckIn);
router.get('/:id/check-in', authorize('SA', 'DESK STAFF', 'ADMIN'), CheckInController.getCheckIn);
router.post('/:id/check-in/confirm', authorize('SA', 'ADMIN'), CheckInController.confirmCheckIn);

// QUẢN LÝ DỊCH VỤ TRONG WO (UC-31, UC-32)
router.post('/:id/services', authorize('SA', 'ADMIN'), addServiceToWO);
router.delete('/:id/services/:serviceId', authorize('SA', 'ADMIN'), removeServiceFromWO);
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
