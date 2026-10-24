import { Router } from 'express';
import { getWorkshopDashboard } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/workshop', authenticate, authorize('MANAGER', 'ADMIN'), getWorkshopDashboard);

export default router;
