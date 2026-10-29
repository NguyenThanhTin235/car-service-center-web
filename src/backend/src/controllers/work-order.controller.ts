import { Request, Response } from 'express';
import { WorkOrderService } from '../services/work-order.service';
import { createWorkOrderSchema } from '../dtos/work-order.dto';
import { addWoServiceSchema } from '../dtos/wo-service.dto';
import { addJobPartSchema, updateJobPartSchema } from '../dtos/job-part.dto';

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

/**
 * PUT /api/work-orders/:id/services/:serviceId/reorder-jobs
 * Cập nhật thứ tự các công việc trong hạng mục
 */
export const reorderJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const workOrderId = Number(req.params.id);
    const serviceId = Number(req.params.serviceId);
    const { job_ids } = req.body;

    if (!Array.isArray(job_ids) || job_ids.length === 0) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Danh sách job_ids không hợp lệ.',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    await workOrderService.reorderJobs(workOrderId, serviceId, job_ids);

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Đã cập nhật thứ tự công việc thành công',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      code: 400,
      message: error.message || 'Lỗi khi sắp xếp thứ tự công việc',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * GET /api/work-orders/my-tracking
 * Lấy danh sách phiếu công việc của khách hàng đang đăng nhập (UC-15)
 */
export const getMyTrackingOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const data = await workOrderService.getMyTrackingOrders(userId);

    res.json({
      success: true,
      code: 200,
      message: 'Lấy danh sách tiến độ sửa chữa thành công',
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 500,
      message: error.message || 'Lỗi khi lấy tiến độ sửa chữa',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * GET /api/work-orders/my-tracking/:id
 * Lấy chi tiết một phiếu công việc theo dõi của khách hàng (UC-15)
 */
export const getMyTrackingOrderDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
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

    const data = await workOrderService.getMyTrackingOrderDetail(workOrderId, userId);

    res.json({
      success: true,
      code: 200,
      message: 'Lấy chi tiết tiến độ thành công',
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      code: statusCode,
      message: error.message || 'Lỗi khi lấy chi tiết tiến độ',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * GET /api/work-orders/:id/parts
 * UC-36: Lấy toàn bộ danh sách phụ tùng trong phiếu công việc
 */
export const getWorkOrderParts = async (req: Request, res: Response): Promise<void> => {
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

    const parts = await workOrderService.getWorkOrderParts(workOrderId);

    res.json({
      success: true,
      code: 200,
      message: 'Lấy danh sách phụ tùng thành công',
      data: parts,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      code: error.statusCode || 400,
      message: error.message || 'Lỗi khi lấy danh sách phụ tùng',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * POST /api/work-orders/:id/jobs/:jobId/parts
 * UC-36: Khai báo thêm phụ tùng vào một Job
 */
export const addPartToJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const workOrderId = Number(req.params.id);
    const jobId = Number(req.params.jobId);

    if (isNaN(workOrderId) || workOrderId <= 0 || isNaN(jobId) || jobId <= 0) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Mã phiếu công việc hoặc mã công việc không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const { error, value } = addJobPartSchema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({
        success: false,
        code: 400,
        message: error.details.map((d: any) => d.message).join('; '),
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const createdPart = await workOrderService.addPartToJob(workOrderId, jobId, value);

    res.status(201).json({
      success: true,
      code: 201,
      message: 'Khai báo phụ tùng vào công việc thành công',
      data: createdPart,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      code: error.statusCode || 400,
      message: error.message || 'Lỗi khi thêm phụ tùng vào công việc',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * PATCH /api/work-orders/:id/jobs/:jobId/parts/:partId
 * UC-36: Cập nhật thông tin phụ tùng trong Job (số lượng dự kiến, đơn giá...)
 */
export const updateJobPart = async (req: Request, res: Response): Promise<void> => {
  try {
    const workOrderId = Number(req.params.id);
    const jobId = Number(req.params.jobId);
    const partId = Number(req.params.partId);

    if (isNaN(workOrderId) || isNaN(jobId) || isNaN(partId)) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Tham số đường dẫn không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const { error, value } = updateJobPartSchema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({
        success: false,
        code: 400,
        message: error.details.map((d: any) => d.message).join('; '),
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const updatedPart = await workOrderService.updateJobPart(workOrderId, jobId, partId, value);

    res.json({
      success: true,
      code: 200,
      message: 'Cập nhật thông tin phụ tùng thành công',
      data: updatedPart,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      code: error.statusCode || 400,
      message: error.message || 'Lỗi khi cập nhật phụ tùng',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * DELETE /api/work-orders/:id/jobs/:jobId/parts/:partId
 * UC-36: Xóa phụ tùng khỏi Job
 */
export const removePartFromJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const workOrderId = Number(req.params.id);
    const jobId = Number(req.params.jobId);
    const partId = Number(req.params.partId);

    if (isNaN(workOrderId) || isNaN(jobId) || isNaN(partId)) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Tham số đường dẫn không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const result = await workOrderService.removePartFromJob(workOrderId, jobId, partId);

    res.json({
      success: true,
      code: 200,
      message: result.message,
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      code: error.statusCode || 400,
      message: error.message || 'Lỗi khi xóa phụ tùng',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * POST /api/work-orders/:id/start-work
 * Bắt đầu thi công phiếu công việc sau khi báo giá đã được duyệt
 */
export const startWorkOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const workOrderId = Number(req.params.id);
    const userId = req.user?.id;
    const userRole = req.user?.roles?.[0] || (req.user as any)?.role || 'SA';

    if (isNaN(workOrderId)) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Mã phiếu công việc không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        code: 401,
        message: 'Không xác định được danh tính người thực hiện',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const result = await workOrderService.startWork(workOrderId, userId, userRole);

    res.status(200).json({
      success: true,
      code: 200,
      message: `Đã kích hoạt bắt đầu thi công phiếu công việc ${result.wo_number} thành công`,
      data: result,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      code: error.statusCode || 400,
      message: error.message || 'Lỗi khi bắt đầu thi công công việc',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * POST /api/work-orders/:id/services/:serviceId/start
 * Bắt đầu thi công cho MỘT hạng mục dịch vụ cụ thể
 */
export const startService = async (req: Request, res: Response): Promise<void> => {
  try {
    const workOrderId = Number(req.params.id);
    const serviceId = Number(req.params.serviceId);
    const userId = req.user?.id;
    const userRole = req.user?.roles?.[0] || (req.user as any)?.role || 'SA';

    if (isNaN(workOrderId) || isNaN(serviceId)) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Mã phiếu công việc hoặc mã hạng mục không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        code: 401,
        message: 'Không xác định được danh tính người thực hiện',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const result = await workOrderService.startService(workOrderId, serviceId, userId, userRole);

    res.status(200).json({
      success: true,
      code: 200,
      message: `Đã kích hoạt bắt đầu thi công hạng mục "${result.name}" thành công`,
      data: result,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      code: error.statusCode || 400,
      message: error.message || 'Lỗi khi bắt đầu thi công hạng mục',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * PATCH /api/work-orders/:id/services/:serviceId/status
 * Cập nhật trạng thái hạng mục dịch vụ
 */
export const updateServiceStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const workOrderId = Number(req.params.id);
    const serviceId = Number(req.params.serviceId);
    const { status } = req.body;

    if (!['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Trạng thái hạng mục không hợp lệ (PENDING, IN_PROGRESS, COMPLETED)',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const updated = await workOrderService.updateServiceStatus(workOrderId, serviceId, status);
    res.json({
      success: true,
      code: 200,
      message: 'Cập nhật trạng thái hạng mục thành công',
      data: updated,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      code: 400,
      message: error.message || 'Lỗi khi cập nhật trạng thái hạng mục',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * PATCH /api/work-orders/:id/jobs/:jobId/status
 * Cập nhật trạng thái công việc
 */
export const updateJobStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const workOrderId = Number(req.params.id);
    const jobId = Number(req.params.jobId);
    const { status } = req.body;

    if (!['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'REWORK', 'PASSED'].includes(status)) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Trạng thái công việc không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const updated = await workOrderService.updateJobStatus(workOrderId, jobId, status);
    res.json({
      success: true,
      code: 200,
      message: 'Cập nhật trạng thái công việc thành công',
      data: updated,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      code: 400,
      message: error.message || 'Lỗi khi cập nhật trạng thái công việc',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * POST /api/work-orders/:id/cancel-release
 * Bàn giao xuất trả xe khi khách từ chối dịch vụ hoặc hủy lệnh
 */
export const cancelAndReleaseWorkOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const workOrderId = Number(req.params.id);
    const userId = (req as any).user.id;
    const { releaseNotes, diagnosticFee, mileage, fuelLevel } = req.body;

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

    const data = await workOrderService.cancelAndReleaseWorkOrder(workOrderId, userId, {
      releaseNotes,
      diagnosticFee: diagnosticFee !== undefined ? Number(diagnosticFee) : undefined,
      mileage: mileage !== undefined ? Number(mileage) : undefined,
      fuelLevel,
    });

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
      message: error.message || 'Lỗi khi bàn giao xuất trả xe',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};


