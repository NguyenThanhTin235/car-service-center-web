import { Request, Response } from 'express';
import { WorkOrderService } from '../services/work-order.service';
import { createWorkOrderSchema } from '../dtos/work-order.dto';
import { addWoServiceSchema } from '../dtos/wo-service.dto';

const workOrderService = new WorkOrderService();

/**
 * GET /api/work-orders/intake-queue
 * Lấy danh sách hàng đợi tiếp nhận cho Cố vấn dịch vụ
 */
export const getIntakeQueueForAdvisor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, page, limit } = req.query;

    const result = await workOrderService.getIntakeQueueForAdvisor({
      status: status as any,
      search: search as string | undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50,
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
 * GET /api/work-orders
 * Lấy danh sách phiếu công việc
 */
export const getWorkOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, page, limit } = req.query;

    const result = await workOrderService.getWorkOrders({
      status: status as any,
      search: search as string | undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50,
    });

    res.json({
      success: true,
      code: 200,
      message: 'Lấy danh sách phiếu công việc thành công',
      data: result.data,
      meta: { pagination: result.pagination },
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 500,
      message: error.message || 'Lỗi khi lấy danh sách phiếu công việc',
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
    const { notes } = req.body;
    
    const workOrder = await workOrderService.updateWorkOrder(Number(id), { notes });

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

/**
 * POST /api/work-orders/:id/services
 * UC-31: Thêm hạng mục dịch vụ vào Work Order
 */
export const addServiceToWO = async (req: Request, res: Response): Promise<void> => {
  try {
    const workOrderId = Number(req.params.id);

    // Validate body
    const { error, value } = addWoServiceSchema.validate(req.body, { abortEarly: false });
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

    const woService = await workOrderService.addService(workOrderId, value.serviceId);

    res.status(201).json({
      success: true,
      code: 201,
      message: 'Thêm dịch vụ thành công',
      data: woService,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    let statusCode = 400;
    if (error.message.includes('Không tìm thấy')) statusCode = 404;
    else if (error.message.includes('đã có trong') || error.message.includes('đã bị vô hiệu')) statusCode = 409;
    else if (error.message.includes('đã đóng') || error.message.includes('đã hủy') || error.message.includes('đã giao xe')) statusCode = 422;

    res.status(statusCode).json({
      success: false,
      code: statusCode,
      message: error.message || 'Lỗi khi thêm dịch vụ',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * DELETE /api/work-orders/:id/services/:serviceId
 * UC-32: Xóa hạng mục dịch vụ khỏi Work Order
 */
export const removeServiceFromWO = async (req: Request, res: Response): Promise<void> => {
  try {
    const workOrderId = Number(req.params.id);
    const woServiceId = Number(req.params.serviceId);

    if (isNaN(woServiceId) || woServiceId <= 0) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Mã dịch vụ không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const result = await workOrderService.removeService(workOrderId, woServiceId);

    res.json({
      success: true,
      code: 200,
      message: `Đã xóa dịch vụ "${result.serviceName}" khỏi phiếu công việc`,
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    let statusCode = 400;
    if (error.message.includes('Không tìm thấy')) statusCode = 404;
    else if (error.message.includes('Không thể xóa') || error.message.includes('không thuộc')) statusCode = 422;
    else if (error.message.includes('đã đóng') || error.message.includes('đã hủy') || error.message.includes('đã giao xe')) statusCode = 422;

    res.status(statusCode).json({
      success: false,
      code: statusCode,
      message: error.message || 'Lỗi khi xóa dịch vụ',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * PATCH /api/work-orders/:id/services/:serviceId
 * Cập nhật thông tin dịch vụ trong Work Order (chỉ khi chưa phân công)
 */
export const updateServiceInWO = async (req: Request, res: Response): Promise<void> => {
  try {
    const workOrderId = Number(req.params.id);
    const woServiceId = Number(req.params.serviceId);
    const { name, pricing_type } = req.body;

    const result = await workOrderService.updateService(workOrderId, woServiceId, { name, pricing_type });

    res.json({
      success: true,
      code: 200,
      message: 'Cập nhật dịch vụ thành công',
      data: result,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    let statusCode = 400;
    if (error.message.includes('Không tìm thấy')) statusCode = 404;
    else if (error.message.includes('Không thể sửa')) statusCode = 422;

    res.status(statusCode).json({
      success: false,
      code: statusCode,
      message: error.message || 'Lỗi khi cập nhật dịch vụ',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * POST /api/work-orders/:id/services/from-finding
 * Tạo nhanh Hạng mục sửa chữa & Công việc con từ Finding
 */
export const createServiceFromFinding = async (req: Request, res: Response): Promise<void> => {
  try {
    const workOrderId = Number(req.params.id);
    const findingId = Number(req.body.finding_id);
    const advisorUserId = req.user?.id;

    if (isNaN(findingId) || findingId <= 0) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Mã vết lỗi (finding_id) không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    if (!advisorUserId) {
      res.status(401).json({
        success: false,
        code: 401,
        message: 'Không xác định được danh tính cố vấn dịch vụ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const result = await workOrderService.createServiceFromFinding(workOrderId, findingId, advisorUserId);

    res.status(201).json({
      success: true,
      code: 201,
      message: `Đã tạo Hạng mục sửa chữa "${result.service.name}" thành công`,
      data: result,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 500,
      message: error.message || 'Lỗi khi tạo hạng mục sửa chữa từ vết lỗi',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * POST /api/work-orders/:id/jobs
 * Tạo công việc thủ công (Dispatch Job)
 */
export const createManualJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const workOrderId = Number(req.params.id);
    const advisorUserId = req.user?.id;

    if (!advisorUserId) {
      res.status(401).json({
        success: false,
        code: 401,
        message: 'Không xác định được danh tính cố vấn dịch vụ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const result = await workOrderService.createManualJob(workOrderId, advisorUserId, req.body);

    res.status(201).json({
      success: true,
      code: 201,
      message: `Đã tạo công việc "${result.job?.name}" thành công`,
      data: result,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      code: 400,
      message: error.message || 'Lỗi khi tạo công việc thủ công',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * PATCH /api/work-orders/:id/jobs/:jobId
 * Cập nhật công việc thủ công khi chưa phân công (status === 'PLANNED')
 */
export const updateManualJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const workOrderId = Number(req.params.id);
    const jobId = Number(req.params.jobId);
    const advisorUserId = req.user?.id;

    if (!advisorUserId) {
      res.status(401).json({
        success: false,
        code: 401,
        message: 'Không xác định được danh tính cố vấn dịch vụ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const updatedJob = await workOrderService.updateManualJob(
      workOrderId,
      jobId,
      advisorUserId,
      req.body
    );

    res.status(200).json({
      success: true,
      code: 200,
      message: `Đã cập nhật công việc "${updatedJob?.name}" thành công`,
      data: updatedJob,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      code: 400,
      message: error.message || 'Lỗi khi cập nhật công việc',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * DELETE /api/work-orders/:id/jobs/:jobId
 * Xóa công việc khi chưa phân công
 */
export const deleteJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const workOrderId = Number(req.params.id);
    const jobId = Number(req.params.jobId);
    const advisorUserId = req.user?.id;

    if (!advisorUserId) {
      res.status(401).json({
        success: false,
        code: 401,
        message: 'Không xác định được danh tính cố vấn dịch vụ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const result = await workOrderService.deleteJob(workOrderId, jobId, advisorUserId);

    res.status(200).json({
      success: true,
      code: 200,
      message: result.message || 'Đã xóa công việc thành công',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      code: 400,
      message: error.message || 'Lỗi khi xóa công việc',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};



