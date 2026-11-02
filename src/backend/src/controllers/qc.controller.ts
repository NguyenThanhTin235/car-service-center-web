import { Request, Response } from 'express';
import { qcService } from '../services/qc.service';

/**
 * GET /api/work-orders/:id/qc
 * Lấy chi tiết thông tin kiểm định chất lượng (QC / KCS)
 */
export const getQcDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const workOrderId = Number(req.params.id);
    if (isNaN(workOrderId) || workOrderId <= 0) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Mã phiếu công việc không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const data = await qcService.getQcDetails(workOrderId);
    res.json({
      success: true,
      code: 200,
      message: 'Lấy thông tin kiểm định chất lượng thành công',
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      code: error.statusCode || 400,
      message: error.message || 'Lỗi khi lấy thông tin kiểm định chất lượng',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * POST /api/work-orders/:id/qc
 * Lưu kết quả đánh giá kiểm định chất lượng (QC / KCS) - Hỗ trợ cả đơn lẻ và hàng loạt (toàn bộ services)
 */
export const submitQcEvaluation = async (req: Request, res: Response): Promise<void> => {
  try {
    const workOrderId = Number(req.params.id);
    const inspectorId = (req as any).user.id;

    if (isNaN(workOrderId) || workOrderId <= 0) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Mã phiếu công việc không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    // Kiểm tra xem là batch request (nhiều dịch vụ) hay single request (1 dịch vụ)
    const isBatch = Array.isArray(req.body) || (req.body && Array.isArray(req.body.evaluations));
    if (isBatch) {
      const evaluations = Array.isArray(req.body) ? req.body : req.body.evaluations;
      const data = await qcService.submitBatchQcEvaluation(workOrderId, inspectorId, evaluations);
      res.status(201).json({
        success: true,
        code: 201,
        message: `Đã lưu kết quả kiểm định cho toàn bộ ${data.successCount} dịch vụ (${data.overallPassCount} đạt chuẩn${
          data.totalFailCount > 0 ? `, ${data.totalFailCount} lỗi phát sinh sửa lại` : ''
        }).`,
        data,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const data = await qcService.submitQcEvaluation(workOrderId, inspectorId, req.body);
    res.status(201).json({
      success: true,
      code: 201,
      message:
        data.overallResult === 'PASS'
          ? 'Đánh giá kiểm định ĐẠT chuẩn thành công'
          : `Ghi nhận kiểm định KHÔNG ĐẠT. Đã tự động tạo ${data.failCount} lệnh sửa lại (Rework).`,
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      code: error.statusCode || 400,
      message: error.message || 'Lỗi khi lưu kết quả kiểm định chất lượng',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * POST /api/work-orders/:id/request-billing
 * Xác nhận đạt chuẩn KCS 100% và gửi yêu cầu phát hành hóa đơn (Billing Gate)
 */
export const requestBilling = async (req: Request, res: Response): Promise<void> => {
  try {
    const workOrderId = Number(req.params.id);
    const advisorId = (req as any).user.id;
    const { notes } = req.body;

    if (isNaN(workOrderId) || workOrderId <= 0) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Mã phiếu công việc không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const data = await qcService.requestBilling(workOrderId, advisorId, notes);
    res.json({
      success: true,
      code: 200,
      message: data.message,
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      code: error.statusCode || 400,
      message: error.message || 'Lỗi khi gửi yêu cầu thanh toán',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

