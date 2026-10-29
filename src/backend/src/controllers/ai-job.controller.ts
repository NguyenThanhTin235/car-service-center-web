import { Request, Response } from 'express';
import { AiJobPlannerService } from '../services/ai-job-planner.service';
import { AiPartPlannerService } from '../services/ai-part-planner.service';

const aiService = new AiJobPlannerService();
const aiPartService = new AiPartPlannerService();

export class AiJobController {
  /**
   * GET /api/work-orders/:id/ai-job-suggestions
   * Sinh danh sách công việc đề xuất bằng RAG
   */
  async getSuggestions(req: Request, res: Response) {
    try {
      const workOrderId = Number(req.params.id);
      if (isNaN(workOrderId)) {
        return res.status(400).json({
          success: false,
          message: 'Mã phiếu công việc (ID) không hợp lệ',
        });
      }

      const serviceIdQuery = req.query.serviceId ? Number(req.query.serviceId) : undefined;
      const targetServiceId = serviceIdQuery && !isNaN(serviceIdQuery) ? serviceIdQuery : undefined;

      const result = await aiService.generateJobSuggestions(workOrderId, targetServiceId);

      return res.status(200).json({
        success: true,
        message: 'Đề xuất công việc bằng AI thành công',
        data: result,
      });
    } catch (err: any) {
      console.error('[AiJobController.getSuggestions Error]:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Lỗi khi đề xuất công việc bằng AI',
      });
    }
  }

  /**
   * POST /api/work-orders/:id/apply-ai-jobs
   * Áp dụng danh sách Jobs đã được SA chọn lọc và chỉnh sửa
   */
  async applyJobs(req: Request, res: Response) {
    try {
      const workOrderId = Number(req.params.id);
      if (isNaN(workOrderId)) {
        return res.status(400).json({
          success: false,
          message: 'Mã phiếu công việc (ID) không hợp lệ',
        });
      }

      const advisorUserId = req.user?.id;
      if (!advisorUserId) {
        return res.status(401).json({
          success: false,
          message: 'Không xác định được danh tính cố vấn dịch vụ',
        });
      }

      const { jobs, services } = req.body;
      const payload = Array.isArray(services) && services.length > 0 ? services : jobs;

      if (!Array.isArray(payload) || payload.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Danh sách hạng mục hoặc công việc áp dụng không hợp lệ hoặc để trống',
        });
      }

      const result = await aiService.applyJobs(workOrderId, advisorUserId, payload);

      return res.status(201).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (err: any) {
      console.error('[AiJobController.applyJobs Error]:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Lỗi khi lưu danh sách công việc vào phiếu',
      });
    }
  }

  /**
   * GET /api/work-orders/:id/jobs/:jobId/ai-part-suggestions
   * Đề xuất phụ tùng và vật tư tiêu hao cho một công việc bằng RAG
   */
  async getPartSuggestions(req: Request, res: Response) {
    try {
      const workOrderId = Number(req.params.id);
      const jobId = Number(req.params.jobId);

      if (isNaN(workOrderId) || isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          message: 'Mã phiếu công việc hoặc mã công việc không hợp lệ',
        });
      }

      const forceRefresh = req.query.refresh === 'true';
      const result = await aiPartService.suggestPartsForJob(workOrderId, jobId, forceRefresh);

      return res.status(200).json({
        success: true,
        message: 'Đề xuất phụ tùng bằng AI thành công',
        data: result,
      });
    } catch (err: any) {
      console.error('[AiJobController.getPartSuggestions Error]:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Lỗi khi đề xuất phụ tùng bằng AI',
      });
    }
  }
}

