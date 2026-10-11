import { Router } from 'express';
import { 
  getAppointments, 
  createAppointment, 
  updateAppointment, 
  confirmAppointment, 
  cancelAppointment,
  getAppointmentById,
  arriveAppointment
} from '../controllers/appointment.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Lấy danh sách & Chi tiết
router.get('/', authenticate, getAppointments);
router.get('/:id', authenticate, getAppointmentById);

// Thêm mới & Cập nhật
router.post('/', authenticate, createAppointment);
router.put('/:id', authenticate, updateAppointment);

// Đổi trạng thái
router.patch('/:id/confirm', authenticate, confirmAppointment);
router.patch('/:id/cancel', authenticate, cancelAppointment);
router.patch('/:id/arrive', authenticate, arriveAppointment);

export default router;
