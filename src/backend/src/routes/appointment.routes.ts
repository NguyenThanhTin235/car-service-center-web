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

const router = Router();

// Lấy danh sách & Chi tiết
router.get('/', getAppointments);
router.get('/:id', getAppointmentById);

// Thêm mới & Cập nhật
router.post('/', createAppointment);
router.put('/:id', updateAppointment);

// Đổi trạng thái
router.patch('/:id/confirm', confirmAppointment);
router.patch('/:id/cancel', cancelAppointment);
router.patch('/:id/arrive', arriveAppointment);

export default router;
