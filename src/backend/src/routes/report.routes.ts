import { Router } from 'express';
import { getOperationalReport } from '../controllers/report.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/reports/operational?type=revenue|services|inventory&start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/operational', authenticate, authorize('MANAGER', 'ADMIN'), getOperationalReport);

export default router;
