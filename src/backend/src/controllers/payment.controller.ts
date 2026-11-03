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
 * POST /api/invoices/:id/payments/vnpay
 * Tạo mã QR / URL thanh toán VNPay (UC-28)
 */
export const createVnpayPayment = async (req: Request, res: Response): Promise<void> => {
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

    const clientIp =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const data = await paymentService.createVnpayPayment(invoiceId, userId, clientIp);

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
      message: error.message || 'Lỗi khi tạo liên kết thanh toán VNPay',
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
 * GET /api/payments/vnpay/ipn
 * Cổng nhận webhook IPN từ VNPay (Server-to-Server, Không qua auth middleware)
 */
export const handleVnpayIpn = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await paymentService.handleVnpayIpn(req.query);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(200).json({
      RspCode: '99',
      Message: error.message || 'Unknown error',
    });
  }
};

/**
 * GET /api/payments/vnpay/return
 * Xử lý kết quả Return URL khi người dùng redirect về từ VNPay
 */
export const verifyVnpayReturn = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await paymentService.verifyVnpayReturn(req.query);

    res.json({
      success: data.isSuccess,
      code: data.isSuccess ? 200 : 400,
      message: data.message,
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      code: statusCode,
      message: error.message || 'Lỗi khi xác thực kết quả thanh toán VNPay',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
};

/**
 * POST /api/payments/:id/simulate-success
 * Giả lập thanh toán VNPay thành công (chỉ cho môi trường Test / Dev)
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
