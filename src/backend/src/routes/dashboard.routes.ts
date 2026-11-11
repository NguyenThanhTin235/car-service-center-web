import { Router } from 'express';
import { getWorkshopDashboard, getMultiPortalDashboard } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Legacy route (Manager & Admin)
router.get('/workshop', authenticate, authorize('MANAGER', 'ADMIN'), getWorkshopDashboard);

// Unified Multi-Portal Dashboard Route
router.get('/:portal', authenticate, getMultiPortalDashboard);

export default router;
