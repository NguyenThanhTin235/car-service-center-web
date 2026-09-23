import { Router } from 'express';
import {
  getServiceTemplates,
  getCategories,
  createServiceTemplate,
  updateServiceTemplate,
  toggleServiceTemplate,
} from '../controllers/service-template.controller';

const router = Router();

// Categories dropdown
router.get('/categories', getCategories);

// UC-59: Danh sách danh mục dịch vụ
router.get('/', getServiceTemplates);

// UC-58: Tạo danh mục dịch vụ
router.post('/', createServiceTemplate);

// UC-60: Cập nhật danh mục dịch vụ
router.put('/:id', updateServiceTemplate);

// UC-61: Toggle active/inactive
router.patch('/:id/toggle', toggleServiceTemplate);

export default router;
