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
  reorderJobs,
  getMyTrackingOrders,
  getMyTrackingOrderDetail,
  getWorkOrderParts,
  addPartToJob,
  updateJobPart,
  removePartFromJob,
  startWorkOrder,
  startService,
  updateServiceStatus,
  updateJobStatus,
  cancelAndReleaseWorkOrder,
} from '../controllers/work-order.controller';
import { CheckInController } from '../controllers/check-in.controller';
import { InspectionController } from '../controllers/inspection.controller';
import aiJobRoutes from './ai-job.routes';

const router = Router();

// Yêu cầu đăng nhập cho toàn bộ
router.use(authenticate);

// UC-15: THEO DÕI TIẾN ĐỘ SỬA CHỮA DÀNH CHO KHÁCH HÀNG
router.get('/my-tracking', authorize('CUSTOMER'), getMyTrackingOrders);
router.get('/my-tracking/:id', authorize('CUSTOMER'), getMyTrackingOrderDetail);

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
router.patch('/:id/jobs/:jobId/status', authorize('SA', 'ADMIN'), updateJobStatus);
router.delete('/:id/jobs/:jobId', authorize('SA', 'ADMIN'), deleteJob);
router.put('/:id/services/:serviceId/reorder-jobs', authorize('SA', 'ADMIN'), reorderJobs);
router.patch('/:id/services/:serviceId', authorize('SA', 'ADMIN'), updateServiceInWO);
router.post('/:id/services/:serviceId/start', authorize('SA', 'ADMIN'), startService);
router.patch('/:id/services/:serviceId/status', authorize('SA', 'ADMIN'), updateServiceStatus);
router.delete('/:id/services/:serviceId', authorize('SA', 'ADMIN'), removeServiceFromWO);

// KHAI BÁO VÀ QUẢN LÝ PHỤ TÙNG / VẬT TƯ CHO CÔNG VIỆC (UC-36)
router.get('/:id/parts', authorize('SA', 'DESK STAFF', 'ADMIN'), getWorkOrderParts);
router.post('/:id/jobs/:jobId/parts', authorize('SA', 'ADMIN'), addPartToJob);
router.patch('/:id/jobs/:jobId/parts/:partId', authorize('SA', 'ADMIN'), updateJobPart);
router.delete('/:id/jobs/:jobId/parts/:partId', authorize('SA', 'ADMIN'), removePartFromJob);

// BẮT ĐẦU THI CÔNG PHIẾU CÔNG VIỆC SAU KHI DUYỆT BÁO GIÁ
router.post('/:id/start-work', authorize('SA', 'ADMIN'), startWorkOrder);

// XUẤT TRẢ XE KHI KHÁCH HÀNG TỪ CHỐI DỊCH VỤ HOẶC HỦY LỆNH
router.post('/:id/cancel-release', authorize('SA', 'ADMIN'), cancelAndReleaseWorkOrder);

// LÊN KẾ HOẠCH CÔNG VIỆC TÍCH HỢP AI LLM (UC-34)
router.use('/', aiJobRoutes);

export default router;
