import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { recordManualPaymentSchema } from '../dtos/invoice.dto';

/**
 * POST /api/invoices/:id/payments
 * Ghi nhận thanh toán thủ công (Tiền mặt hoặc thẻ) (UC-28)
 */
export const recordManualPayment = async (req: Request, res: Response): Promise<void> => {
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

    const { error, value } = recordManualPaymentSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Dữ liệu thanh toán không hợp lệ',
        errors: error.details.map((d) => d.message),
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const data = await paymentService.recordManualPayment(invoiceId, userId, value);

    res.status(201).json({
      success: true,
      code: 201,
      message: data.message,
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      code: statusCode,
      message: error.message || 'Lỗi khi ghi nhận thanh toán',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * GET /api/payments/:id/status
 * Tra cứu trạng thái thanh toán (hỗ trợ polling UI)
 */
export const getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const paymentId = Number(req.params.id);

    if (isNaN(paymentId) || paymentId <= 0) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Mã giao dịch không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const data = await paymentService.getPaymentStatus(paymentId);

    res.json({
      success: true,
      code: 200,
      message: 'Tra cứu trạng thái thanh toán thành công',
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      code: statusCode,
      message: error.message || 'Lỗi khi tra cứu trạng thái thanh toán',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * POST /api/payments/:id/cancel
 * Hủy giao dịch thanh toán đang ở trạng thái PENDING
 */
export const cancelPendingPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const paymentId = Number(req.params.id);

    if (isNaN(paymentId) || paymentId <= 0) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Mã giao dịch không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const data = await paymentService.cancelPendingPayment(paymentId, userId, req.body?.reason);

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
      message: error.message || 'Lỗi khi hủy giao dịch thanh toán',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * POST /api/payments/:id/simulate-success
 * Giả lập thanh toán thành công (chỉ cho môi trường Test / Dev)
 */
export const simulateQrSuccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const paymentId = Number(req.params.id);

    if (isNaN(paymentId) || paymentId <= 0) {
      res.status(400).json({
        success: false,
        code: 400,
        message: 'Mã giao dịch không hợp lệ',
        data: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
      return;
    }

    const data = await paymentService.simulateQrSuccess(paymentId, userId);

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
      message: error.message || 'Lỗi khi giả lập thanh toán',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * POST /api/invoices/:id/payments/sepay
 * Khởi tạo phiên thanh toán SePay (VietQR / Napas) cho hóa đơn
 */
export const createSepayPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const userRoles = (req as any).user.roles?.map((r: any) => r.role?.name || r.name || r) || [];
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

    const { returnUrl, cancelUrl } = req.body || {};

    const data = await paymentService.createSepayPayment(
      invoiceId,
      userId,
      userRoles,
      returnUrl,
      cancelUrl
    );

    res.status(201).json({
      success: true,
      code: 201,
      message: 'Khởi tạo phiên thanh toán SePay thành công',
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      code: statusCode,
      message: error.message || 'Lỗi khi tạo phiên thanh toán SePay',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * POST /api/payments/sepay/ipn
 * Tiếp nhận thông báo tức thời (IPN / Webhook) từ SePay Payment Gateway hoặc SePay Bank Hub
 */
export const handleSepayIpn = async (req: Request, res: Response): Promise<void> => {
  try {
    const secretKeyHeader = req.headers['x-secret-key'];
    const authHeader = req.headers['authorization'];

    console.log('[SePay Webhook Body]:', JSON.stringify(req.body, null, 2));
    console.log('[SePay Webhook Headers]:', { secretKeyHeader, authHeader });

    const result = await paymentService.handleSepayIpn(req.body, secretKeyHeader, authHeader);

    console.log('[SePay Webhook Success Result]:', result);

    res.status(200).json({
      success: true,
      code: 200,
      message: result.message || 'IPN processed successfully',
      data: result,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    console.error('[SePay Webhook Error Caught]:', error.message, error.stack);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      code: statusCode,
      message: error.message || 'Lỗi khi xử lý SePay IPN',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * GET /api/invoices/:id/payments/status
 * Tra cứu trạng thái thanh toán của hóa đơn
 */
export const getInvoicePaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const userRoles = (req as any).user?.roles?.map((r: any) => r.role?.name || r.name || r) || [];
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

    const data = await paymentService.getInvoicePaymentStatus(invoiceId, userId, userRoles);

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Lấy trạng thái thanh toán hóa đơn thành công',
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      code: statusCode,
      message: error.message || 'Lỗi khi tra cứu trạng thái thanh toán',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

