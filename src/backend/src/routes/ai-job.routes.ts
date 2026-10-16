import { Router } from 'express';
import { AiJobController } from '../controllers/ai-job.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();
const controller = new AiJobController();

/**
 * Routes AI Job Planner (UC-34)
 */

// Lấy danh sách jobs đề xuất từ AI RAG
router.get(
  '/:id/ai-job-suggestions',
  authenticate,
  authorize('SA', 'MANAGER', 'ADMIN'),
  controller.getSuggestions.bind(controller)
);

// Áp dụng danh sách jobs đã chọn vào phiếu công việc
router.post(
  '/:id/apply-ai-jobs',
  authenticate,
  authorize('SA', 'MANAGER', 'ADMIN'),
  controller.applyJobs.bind(controller)
);

export default router;

