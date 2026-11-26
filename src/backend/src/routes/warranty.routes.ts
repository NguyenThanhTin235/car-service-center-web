import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  checkVehicleWarrantyEligibility,
  lookupWarranty,
  getCompletedWorkOrdersForVehicle,
} from '../controllers/warranty.controller';

const router = Router();

// Tất cả các route tra cứu bảo hành đều yêu cầu đăng nhập
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
router.get(
  '/vehicles/:vehicleId/history',
  authorize(...INTERNAL_STAFF_ROLES),
  getCompletedWorkOrdersForVehicle
);

export default router;
