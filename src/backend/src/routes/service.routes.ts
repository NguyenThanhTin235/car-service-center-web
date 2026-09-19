import { Router } from 'express';
import { getServices } from '../controllers/service.controller';

const router = Router();

// Lấy danh sách dịch vụ
router.get('/', getServices);

export default router;
