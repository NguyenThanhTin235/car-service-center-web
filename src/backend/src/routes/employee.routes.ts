import { Router } from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  reactivateEmployee,
  getSkills,
} from '../controllers/employee.controller';

const router = Router();

// Danh sách kỹ năng (dùng cho form thêm/sửa nhân viên)
router.get('/skills', getSkills);

// UC-55: Danh sách nhân viên
router.get('/', getEmployees);

// UC-55: Chi tiết nhân viên
router.get('/:id', getEmployeeById);

// UC-54: Thêm nhân viên
router.post('/', createEmployee);

// UC-56: Cập nhật nhân viên
router.put('/:id', updateEmployee);

// UC-57: Vô hiệu hóa nhân viên
router.delete('/:id', deactivateEmployee);

// Khôi phục nhân viên
router.patch('/:id/reactivate', reactivateEmployee);

export default router;
