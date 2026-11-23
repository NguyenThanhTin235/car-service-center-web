import { Request, Response } from 'express';
import { reportService } from '../services/report.service';
import { warrantyReportQuerySchema } from '../dtos/report.dto';

export const getOperationalReport = async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) || 'revenue';
    const start = req.query.start as string | undefined;
    const end = req.query.end as string | undefined;

    if (!['revenue', 'services', 'inventory'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Loại báo cáo không hợp lệ (revenue, services hoặc inventory)' });
    }

    const result = await reportService.getOperationalReport(type as any, start, end);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/reports/warranty
 * UC-87: Báo cáo Thống kê & Phân tích Quản trị Bảo hành
 * Đối tượng: Chỉ duy nhất Quản lý dịch vụ hoặc Quản trị viên hệ thống.
 */
export const getWarrantyReport = async (req: Request, res: Response) => {
  try {
    // 1. Phân quyền chặt chẽ theo UC-87: Chỉ SERVICE_MANAGER, SYSTEM_ADMIN, ADMIN, MANAGER
    const allowedRoles = ['SERVICE_MANAGER', 'SYSTEM_ADMIN', 'ADMIN', 'MANAGER'];
    const userRoles: string[] = req.user
      ? Array.isArray((req.user as any).roles)
        ? (req.user as any).roles
        : [(req.user as any).role || 'CUSTOMER']
      : [];

    const hasPermission = userRoles.some((r) => allowedRoles.includes(r.toUpperCase()));
    if (!hasPermission) {
      console.warn(
        `[SECURITY WARNING - UC-87] Người dùng ID ${req.user?.id} (Roles: ${userRoles.join(
          ', '
        )}) cố gắng truy cập trái phép Báo cáo Quản trị Bảo hành.`
      );
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập dữ liệu báo cáo tài chính và chất lượng của xưởng.',
      });
    }

    // 2. Validate query parameters bằng Joi schema
    const { error, value } = warrantyReportQuerySchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map((d) => d.message).join('; '),
      });
    }

    // 3. Trích xuất báo cáo từ Service
    const result = await reportService.getWarrantyReport(value, userRoles);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    const isForbidden = error.message?.includes('quyền truy cập');
    const isInvalidPeriod = error.message?.includes('Khoảng thời gian không hợp lệ');
    const statusCode = isForbidden ? 403 : isInvalidPeriod ? 400 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Lỗi khi trích xuất báo cáo bảo hành quản trị.',
    });
  }
};
