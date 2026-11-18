import { Request, Response } from 'express';
import { invoiceService } from '../services/invoice.service';
import {
  createInvoiceDraftSchema,
  updateInvoiceDraftSchema,
  cancelInvoiceSchema,
  billingQueueQuerySchema,
} from '../dtos/invoice.dto';

/**
 * GET /api/invoices/my-invoices
 * Lấy danh sách hóa đơn của khách hàng đăng nhập (UC-16)
 */
export const getMyInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { status, search, page, limit } = req.query;

    const data = await invoiceService.getMyInvoices(userId, {
      status: status as string | undefined,
      search: search as string | undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json({
      success: true,
      code: 200,
      message: 'Lấy danh sách hóa đơn thành công',
      data: {
        invoices: data.invoices,
        summary: data.summary,
      },
      meta: {
        pagination: data.pagination,
      },
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 500,
      message: error.message || 'Lỗi khi lấy danh sách hóa đơn',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * GET /api/invoices/billing-queue
 * Hàng chờ lập hóa đơn và danh sách quản lý hóa đơn của Nhân viên quầy (UC-27)
 */
export const getBillingQueue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = billingQueueQuerySchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Tham số truy vấn không hợp lệ',
        errors: error.details.map((d) => d.message),
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const result = await invoiceService.getBillingQueue(value);

    res.json({
      success: true,
      code: 200,
      message: 'Lấy hàng chờ lập hóa đơn thành công',
      data: {
        tab: result.tab,
        summary: result.summary,
        records: result.records,
      },
      meta: {
        pagination: result.pagination,
      },
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      code: statusCode,
      message: error.message || 'Lỗi khi lấy hàng chờ hóa đơn',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * GET /api/invoices/preview?workOrderId=
 * Xem trước bảng kê chi phí và các dòng hóa đơn dự kiến trước khi tạo nháp (UC-27)
 */
export const previewInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const workOrderId = Number(req.query.workOrderId);
    if (isNaN(workOrderId) || workOrderId <= 0) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Mã phiếu công việc (workOrderId) không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const data = await invoiceService.previewInvoice(workOrderId);

    res.json({
      success: true,
      code: 200,
      message: 'Xem trước bảng tính hóa đơn thành công',
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      code: statusCode,
      message: error.message || 'Không thể tạo bản xem trước hóa đơn',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * POST /api/invoices
 * Tạo hóa đơn nháp (UC-27: Create Draft Invoice)
 */
export const createInvoiceDraft = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { error, value } = createInvoiceDraftSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Dữ liệu yêu cầu không hợp lệ',
        errors: error.details.map((d) => d.message),
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const data = await invoiceService.createDraft(value.workOrderId, userId, value.notes);

    res.status(201).json({
      success: true,
      code: 201,
      message: 'Tạo hóa đơn nháp thành công',
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      code: statusCode,
      message: error.message || 'Lỗi khi tạo hóa đơn nháp',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * PATCH /api/invoices/:id
 * Chỉnh sửa chiết khấu và ghi chú của hóa đơn nháp (UC-27: Update Draft Discount)
 */
export const updateInvoiceDraft = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const invoiceId = Number(req.params.id);

    if (isNaN(invoiceId) || invoiceId <= 0) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Mã hóa đơn không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const { error, value } = updateInvoiceDraftSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Dữ liệu cập nhật chiết khấu không hợp lệ',
        errors: error.details.map((d) => d.message),
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const data = await invoiceService.updateDraft(invoiceId, userId, value);

    res.json({
      success: true,
      code: 200,
      message: 'Cập nhật chiết khấu hóa đơn nháp thành công',
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      code: statusCode,
      message: error.message || 'Lỗi khi cập nhật chiết khấu hóa đơn',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * POST /api/invoices/:id/issue
 * Phát hành hóa đơn chính thức (UC-27: Issue Invoice)
 */
export const issueInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const invoiceId = Number(req.params.id);

    if (isNaN(invoiceId) || invoiceId <= 0) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Mã hóa đơn không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const data = await invoiceService.issueInvoice(invoiceId, userId);

    res.json({
      success: true,
      code: 200,
      message: data.message,
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      code: statusCode,
      message: error.message || 'Lỗi khi phát hành hóa đơn',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * POST /api/invoices/:id/cancel
 * Hủy hóa đơn (UC-27: Cancel Invoice)
 */
export const cancelInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const invoiceId = Number(req.params.id);

    if (isNaN(invoiceId) || invoiceId <= 0) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Mã hóa đơn không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const { error, value } = cancelInvoiceSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Dữ liệu hủy hóa đơn không hợp lệ',
        errors: error.details.map((d) => d.message),
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const data = await invoiceService.cancelInvoice(invoiceId, userId, value.reason);

    res.json({
      success: true,
      code: 200,
      message: data.message,
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      code: statusCode,
      message: error.message || 'Lỗi khi hủy hóa đơn',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * GET /api/invoices/:id
 * Lấy chi tiết hóa đơn (kèm kiểm tra quyền sở hữu) (UC-16, UC-27)
 */
export const getInvoiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role || (req as any).user.roles?.[0];
    const invoiceId = Number(req.params.id);

    if (isNaN(invoiceId) || invoiceId <= 0) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Mã hóa đơn không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const data = await invoiceService.getInvoiceById(invoiceId, userId, userRole);

    res.json({
      success: true,
      code: 200,
      message: 'Lấy chi tiết hóa đơn thành công',
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      code: statusCode,
      message: error.message || 'Lỗi khi lấy chi tiết hóa đơn',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * GET /api/invoices/:id/pdf
 * Tải file hóa đơn dịch vụ định dạng PDF (UC-27, UC-16, FR-18)
 */
export const downloadInvoicePdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role || (req as any).user.roles?.[0];
    const invoiceId = Number(req.params.id);

    if (isNaN(invoiceId) || invoiceId <= 0) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Mã hóa đơn không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const pdfBuffer = await invoiceService.generateInvoicePdf(invoiceId, userId, userRole);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Hoa_Don_${invoiceId}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      code: statusCode,
      message: error.message || 'Lỗi khi xuất file PDF hóa đơn',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};
