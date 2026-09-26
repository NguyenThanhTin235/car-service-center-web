import { Request, Response } from 'express';
import { WorkOrderService } from '../services/work-order.service';
import { createWorkOrderSchema } from '../dtos/work-order.dto';

const workOrderService = new WorkOrderService();

/**
 * GET /api/work-orders/intake-queue
 * Lấy danh sách hàng đợi tiếp nhận cho Cố vấn dịch vụ
 */
export const getIntakeQueueForAdvisor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page, limit } = req.query;

    const result = await workOrderService.getIntakeQueueForAdvisor({
      search: search as string | undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json({
      success: true,
      code: 200,
      message: 'Lấy danh sách hàng đợi thành công',
      data: result.data,
      meta: { pagination: result.pagination },
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 500,
      message: error.message || 'Lỗi khi lấy danh sách hàng đợi',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * POST /api/work-orders
 * Tạo phiếu công việc (Work Order) từ phiếu tiếp nhận
 */
export const createWorkOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { error, value } = createWorkOrderSchema.validate(req.body, { abortEarly: false });
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

    // Kiểm tra xác thực
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

    const workOrder = await workOrderService.createWorkOrder(value.intakeRecordId, advisorId);

    res.status(201).json({
      success: true,
      code: 201,
      message: 'Tạo phiếu công việc thành công',
      data: workOrder,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    // Phân loại lỗi dựa trên message
    let statusCode = 400;
    if (error.message.includes('Không tìm thấy')) statusCode = 404;
    else if (error.message.includes('không ở trạng thái') || error.message.includes('đang có phiếu') || error.message.includes('thiếu thông tin')) statusCode = 422;

    res.status(statusCode).json({
      success: false,
      code: statusCode,
      message: error.message || 'Lỗi khi tạo phiếu công việc',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * GET /api/work-orders/:id
 * Lấy chi tiết phiếu công việc
 */
export const getWorkOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const workOrder = await workOrderService.getWorkOrderById(Number(id));

    res.json({
      success: true,
      code: 200,
      message: 'Lấy chi tiết phiếu công việc thành công',
      data: workOrder,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      code: 404,
      message: error.message || 'Không tìm thấy phiếu công việc',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * PUT /api/work-orders/:id
 * Cập nhật thông tin phiếu công việc (Ghi chú, số km...)
 */
export const updateWorkOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes, current_km } = req.body;
    
    const workOrder = await workOrderService.updateWorkOrder(Number(id), { notes, current_km });

    res.json({
      success: true,
      code: 200,
      message: 'Cập nhật phiếu công việc thành công',
      data: workOrder,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      code: 400,
      message: error.message || 'Lỗi khi cập nhật phiếu công việc',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};
