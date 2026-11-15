import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  getMyVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  restoreVehicle,
} from '../controllers/vehicle.controller';

const router = Router();

// Tất cả routes cần xác thực
router.use(authenticate);

// UC-08: Lấy danh sách xe của tôi
router.get('/', getMyVehicles);

// UC-07: Thêm xe mới
router.post('/', createVehicle);

// UC-09: Cập nhật xe
router.put('/:id', updateVehicle);

// UC-10: Xóa hoặc vô hiệu hóa xe
router.delete('/:id', deleteVehicle);

// Kích hoạt lại xe đã vô hiệu hóa
router.patch('/:id/restore', restoreVehicle);

export default router;
