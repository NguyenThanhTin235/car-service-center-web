import { Request, Response } from 'express';
import { InspectionService } from '../services/inspection.service';
import { createFindingSchema, updateFindingSchema } from '../dtos/inspection.dto';

const inspectionService = new InspectionService();

export class InspectionController {
  /**
   * GET /api/work-orders/:id/inspection
   * Lấy thông tin biên bản kiểm tra xe và danh sách findings
   */
  static async getInspection(req: Request, res: Response): Promise<void> {
    try {
      const workOrderId = Number(req.params.id);
      const advisorId = req.user?.id;

      const inspection = await inspectionService.getOrCreateInspection(workOrderId, advisorId);

      res.status(200).json({
        success: true,
        code: 200,
        message: 'Lấy thông tin kiểm tra xe thành công',
        data: inspection,
        timestamp: Math.floor(Date.now() / 1000),
      });
    } catch (error: any) {
      const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        code: statusCode,
        message: error.message || 'Lỗi khi lấy thông tin kiểm tra xe',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
    }
  }

  /**
   * POST /api/work-orders/:id/inspection/findings
   * Thêm một vấn đề phát hiện (Finding/Marker) trên sơ đồ xe
   */
  static async createFinding(req: Request, res: Response): Promise<void> {
    try {
      const workOrderId = Number(req.params.id);
      const advisorId = req.user?.id;

      if (!advisorId) {
        res.status(401).json({
          success: false,
          code: 401,
          message: 'Chưa xác thực người dùng',
          data: null,
          timestamp: Math.floor(Date.now() / 1000),
        });
        return;
      }

      const { error, value } = createFindingSchema.validate(req.body, { abortEarly: false });
      if (error) {
        const errors: Record<string, string> = {};
        error.details.forEach((detail) => {
          const key = detail.path.join('.');
          errors[key] = detail.message;
        });

        res.status(400).json({
          success: false,
          code: 400,
          message: 'Dữ liệu không hợp lệ',
          data: null,
          errors,
          timestamp: Math.floor(Date.now() / 1000),
        });
        return;
      }

      const finding = await inspectionService.addFinding(workOrderId, advisorId, value);

      res.status(201).json({
        success: true,
        code: 201,
        message: 'Thêm vấn đề phát hiện thành công',
        data: finding,
        timestamp: Math.floor(Date.now() / 1000),
      });
    } catch (error: any) {
      let statusCode = 400;
      if (error.message.includes('Không tìm thấy')) statusCode = 404;
      else if (error.message.includes('đã kết thúc') || error.message.includes('Không thể')) statusCode = 422;

      res.status(statusCode).json({
        success: false,
        code: statusCode,
        message: error.message || 'Lỗi khi thêm vấn đề phát hiện',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
    }
  }

  /**
   * PATCH /api/work-orders/:id/inspection/findings/:findingId
   * Cập nhật ghi chú hoặc ảnh minh chứng cho Finding
   */
  static async updateFinding(req: Request, res: Response): Promise<void> {
    try {
      const findingId = Number(req.params.findingId);

      const { error, value } = updateFindingSchema.validate(req.body, { abortEarly: false });
      if (error) {
        const errors: Record<string, string> = {};
        error.details.forEach((detail) => {
          const key = detail.path.join('.');
          errors[key] = detail.message;
        });

        res.status(400).json({
          success: false,
          code: 400,
          message: 'Dữ liệu không hợp lệ',
          data: null,
          errors,
          timestamp: Math.floor(Date.now() / 1000),
        });
        return;
      }

      const updated = await inspectionService.updateFinding(findingId, value);

      res.status(200).json({
        success: true,
        code: 200,
        message: 'Cập nhật vấn đề kiểm tra thành công',
        data: updated,
        timestamp: Math.floor(Date.now() / 1000),
      });
    } catch (error: any) {
      let statusCode = 400;
      if (error.message.includes('Không tìm thấy')) statusCode = 404;
      else if (error.message.includes('đã kết thúc')) statusCode = 422;

      res.status(statusCode).json({
        success: false,
        code: statusCode,
        message: error.message || 'Lỗi khi cập nhật vấn đề kiểm tra',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
    }
  }

  /**
   * DELETE /api/work-orders/:id/inspection/findings/:findingId
   * Xóa Finding (kiểm tra ngoại lệ liên kết Job)
   */
  static async deleteFinding(req: Request, res: Response): Promise<void> {
    try {
      const findingId = Number(req.params.findingId);

      const result = await inspectionService.deleteFinding(findingId);

      res.status(200).json({
        success: true,
        code: 200,
        message: result.message,
        data: { id: result.id },
        timestamp: Math.floor(Date.now() / 1000),
      });
    } catch (error: any) {
      let statusCode = 400;
      if (error.message.includes('Không tìm thấy')) statusCode = 404;
      else if (error.message.includes('liên kết với công việc') || error.message.includes('đã kết thúc')) {
        statusCode = 422;
      }

      res.status(statusCode).json({
        success: false,
        code: statusCode,
        message: error.message || 'Lỗi khi xóa vấn đề kiểm tra',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
    }
  }
}
