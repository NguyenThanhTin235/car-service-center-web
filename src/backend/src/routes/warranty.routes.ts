import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  checkVehicleWarrantyEligibility,
  lookupWarranty,
  validateOdoIntake,
  getCompletedWorkOrdersForVehicle,
  createGoodwillClaim,
  listGoodwillClaims,
  getGoodwillClaimDetail,
  approveGoodwillClaim,
  rejectGoodwillClaim,
} from '../controllers/warranty.controller';

const router = Router();

// Tất cả các route tra cứu và xác thực bảo hành đều yêu cầu đăng nhập
router.use(authenticate);

// UC-81: Tra cứu linh hoạt theo query params (?licensePlate=... hoặc ?vehicleId=...)
router.get('/lookup', lookupWarranty);

// UC-81: Tra cứu theo ID phương tiện
router.get('/vehicles/:vehicleId/eligibility', checkVehicleWarrantyEligibility);

const INTERNAL_STAFF_ROLES = [
  'ADMIN',
  'MANAGER',
  'SERVICE_MANAGER',
  'SYSTEM_ADMIN',
  'ADVISOR',
  'SA',
  'SERVICE_ADVISOR',
  'DESK STAFF',
  'FRONT_DESK',
];

// UC-83: Lấy danh sách phiếu sửa chữa đã hoàn tất của xe để chọn phiếu gốc
router.get('/vehicles/:vehicleId/history', authorize(...INTERNAL_STAFF_ROLES), getCompletedWorkOrdersForVehicle);

// UC-83: Xác thực chống tua lùi ODO khi tiếp nhận xe bảo hành
router.post('/validate-odo', authorize(...INTERNAL_STAFF_ROLES), validateOdoIntake);

// ==========================================
// UC-86: QUẢN LÝ BẢO HÀNH THIỆN CHÍ (GOODWILL CLAIMS)
// ==========================================

// Nhân viên quầy / Cố vấn đề xuất hỗ trợ bảo hành thiện chí khi quá hạn nhẹ
router.post('/goodwill-claims', authorize(...INTERNAL_STAFF_ROLES), createGoodwillClaim);

// Quản lý xem danh sách hồ sơ bảo hành thiện chí
router.get(
  '/goodwill-claims',
  authorize('ADMIN', 'MANAGER', 'SERVICE_MANAGER', 'SYSTEM_ADMIN'),
  listGoodwillClaims
);

// Quản lý xem hồ sơ thẩm định chi tiết (lịch sử khách hàng, số lần dịch vụ, phiếu gốc)
router.get(
  '/goodwill-claims/:id',
  authorize('ADMIN', 'MANAGER', 'SERVICE_MANAGER', 'SYSTEM_ADMIN'),
  getGoodwillClaimDetail
);

// Quản lý phê duyệt bảo hành thiện chí (3 mức: FULL, LABOUR_ONLY, PERCENTAGE)
router.patch(
  '/goodwill-claims/:id/approve',
  authorize('ADMIN', 'MANAGER', 'SERVICE_MANAGER', 'SYSTEM_ADMIN'),
  approveGoodwillClaim
);

// Quản lý từ chối bảo hành thiện chí
router.patch(
  '/goodwill-claims/:id/reject',
  authorize('ADMIN', 'MANAGER', 'SERVICE_MANAGER', 'SYSTEM_ADMIN'),
  rejectGoodwillClaim
);

export default router;

