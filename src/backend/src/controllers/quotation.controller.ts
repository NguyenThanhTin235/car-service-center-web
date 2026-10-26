import { Request, Response } from 'express';
import { quotationService } from '../services/quotation.service';
import { generateQuotationPdfBuffer } from '../utils/pdf-quotation.util';

/**
 * GET /api/work-orders/:workOrderId/quotations
 * Lấy danh sách toàn bộ báo giá của phiếu công việc
 */
export const getQuotationsByWorkOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const workOrderId = Number(req.params.workOrderId);
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

    const data = await quotationService.getQuotationsByWorkOrder(workOrderId);
    res.json({
      success: true,
      code: 200,
      message: 'Lấy danh sách báo giá thành công',
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      code: error.statusCode || 500,
      message: error.message || 'Lỗi khi lấy danh sách báo giá',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * GET /api/quotations/:id
 * Lấy chi tiết báo giá theo ID
 */
export const getQuotationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (isNaN(id) || id <= 0) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Mã báo giá không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const data = await quotationService.getQuotationById(id, userRole, userId);
    res.json({
      success: true,
      code: 200,
      message: 'Lấy chi tiết báo giá thành công',
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      code: error.statusCode || 500,
      message: error.message || 'Lỗi khi lấy chi tiết báo giá',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * POST /api/work-orders/:workOrderId/quotations
 * Tạo báo giá tự động từ kế hoạch công việc (UC-37)
 */
export const createQuotation = async (req: Request, res: Response): Promise<void> => {
  try {
    const workOrderId = Number(req.params.workOrderId);
    const advisorUserId = (req as any).user.id;

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

    const data = await quotationService.createQuotation(workOrderId, advisorUserId, req.body);
    const isDuplicate = Boolean((data as any)?.isDuplicate);
    res.status(isDuplicate ? 200 : 201).json({
      success: true,
      code: isDuplicate ? 200 : 201,
      message: isDuplicate ? (data as any).duplicateMessage : 'Tạo báo giá thành công',
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      code: error.statusCode || 400,
      message: error.message || 'Lỗi khi tạo báo giá',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * PATCH /api/quotations/:id
 * Cập nhật báo giá (chiết khấu, ghi chú) (UC-39)
 */
export const updateQuotation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const advisorUserId = (req as any).user.id;

    if (isNaN(id) || id <= 0) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Mã báo giá không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const data = await quotationService.updateQuotation(id, advisorUserId, req.body);
    res.json({
      success: true,
      code: 200,
      message: 'Cập nhật báo giá thành công',
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      code: error.statusCode || 400,
      message: error.message || 'Lỗi khi cập nhật báo giá',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * POST /api/quotations/:id/send
 * Gửi báo giá cho khách hàng -> chuyển Work Order sang PENDING_APPROVAL
 */
export const sendQuotation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const advisorUserId = (req as any).user.id;

    if (isNaN(id) || id <= 0) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Mã báo giá không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const data = await quotationService.sendQuotation(id, advisorUserId);
    res.json({
      success: true,
      code: 200,
      message: 'Đã gửi báo giá cho khách hàng thành công',
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      code: error.statusCode || 400,
      message: error.message || 'Lỗi khi gửi báo giá',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * POST /api/quotations/:id/approve
 * Phê duyệt báo giá (Customer duyệt hoặc Advisor ghi nhận) (UC-39)
 */
export const approveQuotation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (isNaN(id) || id <= 0) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Mã báo giá không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const data = await quotationService.approveQuotation(id, userId, userRole);
    res.json({
      success: true,
      code: 200,
      message: 'Phê duyệt báo giá thành công',
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      code: error.statusCode || 400,
      message: error.message || 'Lỗi khi phê duyệt báo giá',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * POST /api/quotations/:id/reject
 * Từ chối báo giá (Customer từ chối hoặc Advisor ghi nhận) (UC-39)
 */
export const rejectQuotation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { reason } = req.body;

    if (isNaN(id) || id <= 0) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Mã báo giá không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const data = await quotationService.rejectQuotation(id, reason, userId, userRole);
    res.json({
      success: true,
      code: 200,
      message: 'Đã ghi nhận từ chối báo giá',
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      code: error.statusCode || 400,
      message: error.message || 'Lỗi khi từ chối báo giá',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * POST /api/quotations/:id/cancel
 * Hủy báo giá nháp (UC-40)
 */
export const cancelQuotation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const advisorUserId = (req as any).user.id;

    if (isNaN(id) || id <= 0) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Mã báo giá không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const data = await quotationService.cancelQuotation(id, advisorUserId);
    res.json({
      success: true,
      code: 200,
      message: 'Hủy báo giá thành công',
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      code: error.statusCode || 400,
      message: error.message || 'Lỗi khi hủy báo giá',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * GET /api/quotations/:id/pdf
 * Xuất file PDF Báo giá
 */
export const exportQuotationPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (isNaN(id) || id <= 0) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Mã báo giá không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const quotation = await quotationService.getQuotationById(id, userRole, userId);
    const pdfBuffer = await generateQuotationPdfBuffer({
      quotationNumber: quotation.quotationNumber,
      quotationType: quotation.quotationType,
      status: quotation.status,
      createdAt: quotation.createdAt,
      customerName: quotation.workOrder.customer?.full_name || 'Khách hàng',
      customerPhone: quotation.workOrder.customer?.phone || '',
      customerEmail: quotation.workOrder.customer?.email || '',
      licensePlate: quotation.workOrder.vehicle?.license_plate || '',
      vehicleName: `${quotation.workOrder.vehicle?.make || ''} ${quotation.workOrder.vehicle?.model || ''}`,
      advisorName: quotation.workOrder.advisor?.full_name || '',
      subtotal: quotation.subtotal,
      discountAmount: quotation.discountAmount,
      grandTotal: quotation.grandTotal,
      lines: quotation.lines.map((l: any) => ({
        lineType: l.lineType,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.snapshotUnitPrice,
        amount: l.amount,
      })),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${quotation.quotationNumber}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      code: error.statusCode || 500,
      message: error.message || 'Lỗi khi xuất file PDF báo giá',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};
