import { Router } from 'express';
import {
  getJobTypes,
  createJobType,
  updateJobType,
  toggleJobType,
  deleteJobType,
} from '../controllers/job-type.controller';

const router = Router();

// UC-63: Danh sách loại công việc
router.get('/', getJobTypes);

// UC-62: Tạo loại công việc
router.post('/', createJobType);

// UC-64: Cập nhật loại công việc
router.put('/:id', updateJobType);

// UC-65: Toggle active/inactive
router.patch('/:id/toggle', toggleJobType);

// UC-69: Xóa loại công việc (hard delete nếu không có ràng buộc)
router.delete('/:id', deleteJobType);

export default router;
