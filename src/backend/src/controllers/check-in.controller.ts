import { Request, Response } from 'express';
import { CheckInService } from '../services/check-in.service';
import { createCheckInSchema, updateCheckInSchema } from '../dtos/check-in.dto';

const checkInService = new CheckInService();

export class CheckInController {
  /**
   * POST /api/work-orders/:id/check-in
   * Tạo mới hoặc cập nhật ghi nhận tình trạng xe
   */
  static async createOrUpdateCheckIn(req: Request, res: Response): Promise<void> {
    try {
      const workOrderId = Number(req.params.id);
      
      // Sử dụng partial update validation nếu là cập nhật
      const { error, value } = createCheckInSchema.validate(req.body, { abortEarly: false, allowUnknown: true });
      
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

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          code: 401,
          message: 'Chưa xác thực người dùng',
          data: null,
          timestamp: Math.floor(Date.now() / 1000),
        });
        return;
      }

      const checkIn = await checkInService.createOrUpdateCheckIn(workOrderId, value, userId);

      res.status(200).json({
        success: true,
        code: 200,
        message: 'Lưu thông tin tình trạng xe thành công',
        data: checkIn,
        timestamp: Math.floor(Date.now() / 1000),
      });
    } catch (error: any) {
      const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        code: statusCode,
        message: error.message || 'Lỗi khi lưu thông tin tình trạng xe',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
    }
  }

  /**
   * GET /api/work-orders/:id/check-in
   * Lấy chi tiết ghi nhận tình trạng xe
   */
  static async getCheckIn(req: Request, res: Response): Promise<void> {
    try {
      const workOrderId = Number(req.params.id);
      const checkIn = await checkInService.getCheckInByWorkOrderId(workOrderId);

      if (!checkIn) {
        res.status(404).json({
          success: false,
          code: 404,
          message: 'Chưa có thông tin ghi nhận tình trạng xe',
          data: null,
          timestamp: Math.floor(Date.now() / 1000),
        });
        return;
      }

      res.status(200).json({
        success: true,
        code: 200,
        message: 'Lấy thông tin tình trạng xe thành công',
        data: checkIn,
        timestamp: Math.floor(Date.now() / 1000),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        code: 500,
        message: error.message || 'Lỗi hệ thống',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
    }
  }

  /**
   * POST /api/work-orders/:id/check-in/confirm
   * Khách hàng ký xác nhận tình trạng xe
   */
  static async confirmCheckIn(req: Request, res: Response): Promise<void> {
    try {
      const workOrderId = Number(req.params.id);
      const checkIn = await checkInService.confirmCheckIn(workOrderId);

      res.status(200).json({
        success: true,
        code: 200,
        message: 'Xác nhận tình trạng xe thành công',
        data: checkIn,
        timestamp: Math.floor(Date.now() / 1000),
      });
    } catch (error: any) {
      const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        code: statusCode,
        message: error.message || 'Lỗi khi xác nhận tình trạng xe',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
    }
  }
}
