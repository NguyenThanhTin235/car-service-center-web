import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  reactivateUser,
  resetUserPassword,
} from '../controllers/user.controller';

const router = Router();

// UC-51: Danh sách tài khoản
router.get('/', getUsers);

// UC-51: Chi tiết tài khoản
router.get('/:id', getUserById);

// UC-50: Thêm tài khoản
router.post('/', createUser);

// UC-52: Cập nhật tài khoản
router.put('/:id', updateUser);

// UC-53: Vô hiệu hóa tài khoản
router.delete('/:id', deactivateUser);

// Khôi phục tài khoản
router.patch('/:id/reactivate', reactivateUser);

// Đặt lại mật khẩu
router.patch('/:id/reset-password', resetUserPassword);

export default router;
