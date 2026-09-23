import { Router } from 'express';
import {
  getCatalogs,
  createCatalog,
  updateCatalog,
  toggleCatalog,
} from '../controllers/system-catalog.controller';

const router = Router();

// UC-71: Danh sách danh mục chung
router.get('/', getCatalogs);

// UC-70: Tạo danh mục chung
router.post('/', createCatalog);

// UC-72: Cập nhật danh mục chung
router.put('/:id', updateCatalog);

// UC-73: Toggle active/inactive
router.patch('/:id/toggle', toggleCatalog);

export default router;
