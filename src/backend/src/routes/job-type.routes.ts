import { Router } from 'express';
import {
  getJobTypes,
  createJobType,
  updateJobType,
  toggleJobType,
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

export default router;
