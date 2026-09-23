import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/service-category.controller';

const router = Router();

// UC-63: Xem danh sách danh mục dịch vụ
router.get('/', getCategories);

// UC-62: Tạo danh mục dịch vụ
router.post('/', createCategory);

// UC-64: Cập nhật danh mục dịch vụ
router.put('/:id', updateCategory);

// UC-65: Xóa danh mục dịch vụ
router.delete('/:id', deleteCategory);

export default router;
