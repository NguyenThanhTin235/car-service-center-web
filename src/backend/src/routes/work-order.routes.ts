import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  getIntakeQueueForAdvisor,
  getWorkOrders,
  createWorkOrder,
  getWorkOrderById,
  updateWorkOrder,
  addServiceToWO,
  updateServiceInWO,
  removeServiceFromWO,
  createServiceFromFinding,
  createManualJob,
  updateManualJob,
  deleteJob,
} from '../controllers/work-order.controller';
import { CheckInController } from '../controllers/check-in.controller';
import { InspectionController } from '../controllers/inspection.controller';
import aiJobRoutes from './ai-job.routes';

const router = Router();


// Yêu cầu đăng nhập cho toàn bộ
router.use(authenticate);

// Lấy danh sách hàng đợi tiếp nhận (cho Advisor tạo WO)
router.get('/intake-queue', authorize('SA', 'ADMIN'), getIntakeQueueForAdvisor);

// Lấy danh sách phiếu công việc
router.get('/', authorize('SA', 'ADMIN', 'DESK STAFF'), getWorkOrders);

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

// KIỂM TRA XE & VẤN ĐỀ PHÁT HIỆN (UC-33)
router.get('/:id/inspection', authorize('SA', 'DESK STAFF', 'ADMIN'), InspectionController.getInspection);
router.post('/:id/inspection/findings', authorize('SA', 'ADMIN'), InspectionController.createFinding);
router.patch('/:id/inspection/findings/:findingId', authorize('SA', 'ADMIN'), InspectionController.updateFinding);
router.delete('/:id/inspection/findings/:findingId', authorize('SA', 'ADMIN'), InspectionController.deleteFinding);

// QUẢN LÝ DỊCH VỤ & CÔNG VIỆC TRONG WO (UC-31, UC-32, UC-34)
router.post('/:id/services', authorize('SA', 'ADMIN'), addServiceToWO);
router.post('/:id/services/from-finding', authorize('SA', 'ADMIN'), createServiceFromFinding);
router.post('/:id/jobs', authorize('SA', 'ADMIN'), createManualJob);
router.patch('/:id/jobs/:jobId', authorize('SA', 'ADMIN'), updateManualJob);
router.delete('/:id/jobs/:jobId', authorize('SA', 'ADMIN'), deleteJob);
router.patch('/:id/services/:serviceId', authorize('SA', 'ADMIN'), updateServiceInWO);
router.delete('/:id/services/:serviceId', authorize('SA', 'ADMIN'), removeServiceFromWO);

// LÊN KẾ HOẠCH CÔNG VIỆC TÍCH HỢP AI LLM (UC-34)
router.use('/', aiJobRoutes);

export default router;

