import { Request, Response } from 'express';
import { invoiceService } from '../services/invoice.service';

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
      data,
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
 * GET /api/invoices/:id
 * Lấy chi tiết hóa đơn (kèm kiểm tra quyền sở hữu) (UC-16)
 */
export const getInvoiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
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
