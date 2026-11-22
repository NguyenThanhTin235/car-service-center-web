import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { multiDashboardService, DashboardPeriodKey, DashboardScope } from '../services/multi-dashboard.service';

export const getWorkshopDashboard = async (_req: Request, res: Response) => {
  try {
    const result = await dashboardService.getWorkshopDashboard();
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const PORTAL_ROLES_MAP: Record<string, string[]> = {
  admin: ['ADMIN'],
  manager: ['MANAGER', 'ADMIN'],
  sa: ['SERVICE ADVISOR', 'MANAGER', 'ADMIN'],
  staff: ['TECHNICIAN', 'DESK STAFF', 'PARTS COORDINATOR', 'MANAGER', 'ADMIN'],
};

export const getMultiPortalDashboard = async (req: Request, res: Response) => {
  try {
    const rawPortal = req.params.portal;
    const portal = (typeof rawPortal === 'string' ? rawPortal : Array.isArray(rawPortal) ? rawPortal[0] : '').toLowerCase();
    const allowedPortals = ['admin', 'manager', 'sa', 'staff'];

    if (!allowedPortals.includes(portal)) {
      return res.status(400).json({
        success: false,
        message: 'Portal không hợp lệ. Giá trị cho phép: admin, manager, sa, staff',
      });
    }

    const userRoles = req.user?.roles || [];
    const allowedRoles = PORTAL_ROLES_MAP[portal] || [];
    const hasRole = userRoles.some((r) => allowedRoles.includes(r.toUpperCase()));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập bảng điều khiển này.',
      });
    }

    const period = (req.query.period as DashboardPeriodKey) || '7days';
    const scope = (req.query.scope as DashboardScope) || 'my';
    const startDate = req.query.start_date as string | undefined;
    const endDate = req.query.end_date as string | undefined;
    const userId = req.user?.id || 0;

    let result;
    switch (portal) {
      case 'admin':
        result = await multiDashboardService.getAdminDashboard(period, startDate, endDate);
        break;
      case 'manager':
        result = await multiDashboardService.getManagerDashboard(period, startDate, endDate);
        break;
      case 'sa':
        result = await multiDashboardService.getSaDashboard(userId, scope, period, startDate, endDate);
        break;
      case 'staff':
        result = await multiDashboardService.getStaffDashboard(userId, scope, period, startDate, endDate);
        break;
    }

    return res.status(200).json({
      success: true,
      data: result,
      message: `Lấy dữ liệu dashboard ${portal} thành công`,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi xử lý bảng điều khiển',
    });
  }
};
