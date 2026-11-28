import { Request, Response } from 'express';
import logger from '../loggers/logger';
import { AiJobPlannerService, AiDomainError } from '../services/ai-job-planner.service';
import { AiPartPlannerService } from '../services/ai-part-planner.service';
import { getAiMetricsSnapshot } from '../utils/ai-telemetry.util';
import { getGeminiClientHealth } from '../utils/ai-client.util';

const aiService = new AiJobPlannerService();
const aiPartService = new AiPartPlannerService();

function sendSuccess<T>(res: Response, data: T, message: string, code = 200): void {
  res.status(code).json({
    success: true,
    code,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

function sendError(
  res: Response,
  code: number,
  errorCode: string,
  message: string,
  details?: unknown
): void {
  res.status(code).json({
    success: false,
    code,
    message,
    error: {
      code: errorCode,
      ...(details !== undefined ? { details } : {}),
    },
    timestamp: new Date().toISOString(),
  });
}

function handleControllerError(
  req: Request,
  res: Response,
  err: unknown,
  contextLabel: string,
  fallbackMessage: string
): void {
  const traceId = (req as Request & { requestId?: string }).requestId;

  if (err instanceof AiDomainError) {
    sendError(res, err.statusCode, err.errorCode, err.message, err.details);
    return;
  }

  logger.error(`[${contextLabel}] Unexpected error`, {
    traceId,
    error: err instanceof Error ? err.message : String(err),
  });

  sendError(res, 500, 'AI_INTERNAL_ERROR', fallbackMessage);
}

export class AiJobController {
  /**
   * GET /api/work-orders/ai-metrics
   * Trả về thống kê hiệu suất, token, fallback và trạng thái circuit breaker AI.
   */
  async getMetrics(_req: Request, res: Response): Promise<void> {
    sendSuccess(
      res,
      {
        metrics: getAiMetricsSnapshot(),
        llmGateway: getGeminiClientHealth(),
      },
      'Lấy chỉ số giám sát hệ thống AI thành công.'
    );
  }

  /**
   * GET /api/work-orders/:id/ai-job-suggestions
   * Sinh danh sách công việc đề xuất bằng RAG
   */
  async getSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const workOrderId = Number(req.params.id);
      if (!Number.isInteger(workOrderId) || workOrderId <= 0) {
        sendError(res, 400, 'VALIDATION_ERROR', 'Mã phiếu công việc (ID) không hợp lệ', {
          field: 'id',
        });
        return;
      }

      const serviceIdQuery = req.query.serviceId ? Number(req.query.serviceId) : undefined;
      const targetServiceId =
        serviceIdQuery && Number.isInteger(serviceIdQuery) && serviceIdQuery > 0
          ? serviceIdQuery
          : undefined;

      const traceId = (req as Request & { requestId?: string }).requestId;
      const result = await aiService.generateJobSuggestions(workOrderId, targetServiceId, traceId);

      sendSuccess(res, result, 'Đề xuất công việc bằng AI thành công');
    } catch (err) {
      handleControllerError(
        req,
        res,
        err,
        'AiJobController.getSuggestions',
        'Hệ thống trợ lý kỹ thuật AI đang bận, vui lòng thử lại sau.'
      );
    }
  }

  /**
   * POST /api/work-orders/:id/apply-ai-jobs
   * Áp dụng danh sách Jobs đã được SA chọn lọc và chỉnh sửa
   */
  async applyJobs(req: Request, res: Response): Promise<void> {
    try {
      const workOrderId = Number(req.params.id);
      if (!Number.isInteger(workOrderId) || workOrderId <= 0) {
        sendError(res, 400, 'VALIDATION_ERROR', 'Mã phiếu công việc (ID) không hợp lệ', {
          field: 'id',
        });
        return;
      }

      const advisorUserId = req.user?.id;
      if (!advisorUserId) {
        sendError(res, 401, 'UNAUTHORIZED', 'Không xác định được danh tính cố vấn dịch vụ');
        return;
      }

      const { jobs, services } = req.body || {};
      const payload = Array.isArray(services) && services.length > 0 ? services : jobs;

      if (!Array.isArray(payload) || payload.length === 0) {
        sendError(
          res,
          400,
          'VALIDATION_ERROR',
          'Danh sách hạng mục hoặc công việc áp dụng không hợp lệ hoặc để trống'
        );
        return;
      }

      const result = await aiService.applyJobs(workOrderId, advisorUserId, payload);
      const message = `Đã áp dụng thành công ${result.applied_jobs_count} công việc vào phiếu`;

      sendSuccess(res, result, message, 201);
    } catch (err) {
      handleControllerError(
        req,
        res,
        err,
        'AiJobController.applyJobs',
        'Không thể áp dụng danh sách công việc vào phiếu. Vui lòng thử lại sau.'
      );
    }
  }

  /**
   * GET /api/work-orders/:id/jobs/:jobId/ai-part-suggestions
   * Đề xuất phụ tùng và vật tư tiêu hao cho một công việc bằng RAG
   */
  async getPartSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const workOrderId = Number(req.params.id);
      const jobId = Number(req.params.jobId);

      if (
        !Number.isInteger(workOrderId) ||
        workOrderId <= 0 ||
        !Number.isInteger(jobId) ||
        jobId <= 0
      ) {
        sendError(res, 400, 'VALIDATION_ERROR', 'Mã phiếu công việc hoặc mã công việc không hợp lệ');
        return;
      }

      const forceRefresh = req.query.refresh === 'true';
      const traceId = (req as Request & { requestId?: string }).requestId;
      const result = await aiPartService.suggestPartsForJob(
        workOrderId,
        jobId,
        forceRefresh,
        traceId
      );

      sendSuccess(res, result, 'Đề xuất phụ tùng bằng AI thành công');
    } catch (err) {
      handleControllerError(
        req,
        res,
        err,
        'AiJobController.getPartSuggestions',
        'Hệ thống gợi ý phụ tùng AI đang bận, vui lòng thử lại sau.'
      );
    }
  }
}
