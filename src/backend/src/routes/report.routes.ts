import { Router } from 'express';
import { getOperationalReport, getWarrantyReport } from '../controllers/report.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/reports/operational?type=revenue|services|inventory&start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/operational', authenticate, authorize('MANAGER', 'ADMIN'), getOperationalReport);

// GET /api/reports/warranty?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&groupBy=TECHNICIAN|CATEGORY|PART
// UC-87: Báo cáo Thống kê & Phân tích Quản trị Bảo hành (Chỉ Quản lý dịch vụ & Quản trị viên)
router.get('/warranty', authenticate, getWarrantyReport);

export default router;
