import { Router } from 'express';
import { AiJobController } from '../controllers/ai-job.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { aiWorkshopRateLimiter } from '../middlewares/ai-chat-rate-limit.middleware';
import { idempotencyGuard } from '../middlewares/idempotency.middleware';

const router = Router();
const controller = new AiJobController();

/**
 * Routes AI Job Planner (UC-34) & Observability Metrics
 */

// Endpoint theo dõi telemetry & trạng thái AI Gateway (ADMIN / MANAGER)
router.get(
  '/ai-metrics',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  controller.getMetrics.bind(controller)
);

// Lấy danh sách jobs đề xuất từ AI RAG
router.get(
  '/:id/ai-job-suggestions',
  authenticate,
  authorize('SA', 'MANAGER', 'ADMIN'),
  aiWorkshopRateLimiter,
  controller.getSuggestions.bind(controller)
);

// Áp dụng danh sách jobs đã chọn vào phiếu công việc (chỉ SA / ADMIN được quyền mutate WO)
router.post(
  '/:id/apply-ai-jobs',
  authenticate,
  authorize('SA', 'ADMIN'),
  aiWorkshopRateLimiter,
  idempotencyGuard,
  controller.applyJobs.bind(controller)
);

// Đề xuất phụ tùng và vật tư tiêu hao cho một công việc bằng RAG
router.get(
  '/:id/jobs/:jobId/ai-part-suggestions',
  authenticate,
  authorize('SA', 'MANAGER', 'ADMIN'),
  aiWorkshopRateLimiter,
  controller.getPartSuggestions.bind(controller)
);

export default router;
