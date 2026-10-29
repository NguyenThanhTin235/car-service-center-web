import { Router } from 'express';
import {
  getServices,
  getCategories,
  createService,
  updateService,
  toggleService,
} from '../controllers/service.controller';

const router = Router();

// Categories dropdown
router.get('/categories', getCategories);

// UC-59: Danh sách danh mục dịch vụ
router.get('/', getServices);

// UC-58: Tạo danh mục dịch vụ
router.post('/', createService);

// UC-60: Cập nhật danh mục dịch vụ
router.put('/:id', updateService);

// UC-61: Toggle active/inactive
router.patch('/:id/toggle', toggleService);

export default router;
