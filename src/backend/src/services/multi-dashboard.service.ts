import prisma from '../utils/prisma';
import { getCache, setCache } from '../utils/redis.util';
import { WorkOrderStatus, JobStatus, InvoiceStatus } from '@prisma/client';

const MULTI_DASHBOARD_CACHE_TTL = 20;

export type DashboardPeriodKey = 'today' | '7days' | '30days' | 'this_month' | 'custom';
export type DashboardScope = 'my' | 'workshop';

export interface DashboardKPIMetric {
  key: string;
  label: string;
  value: number | string;
  prevValue?: number;
  format?: 'currency' | 'number' | 'percent';
  trendInverted?: boolean;
  unit?: string;
}

export interface DashboardResponseData {
  portal: 'admin' | 'manager' | 'sa' | 'staff';
  period: {
    key: DashboardPeriodKey;
    startDate: string;
    endDate: string;
  };
  kpis: DashboardKPIMetric[];
  charts: Record<string, any>;
  actionableList: any[];
}

export class MultiDashboardService {
  /**
   * Cache Redis/memory 20s cho các dashboard tổng hợp nhiều query (bỏ qua trong môi trường unit test)
   */
  private async withDashboardCache<T>(cacheKey: string, loader: () => Promise<T>): Promise<T> {
    if (process.env.NODE_ENV !== 'test') {
      try {
        const cached = await getCache(cacheKey);
        if (cached) return JSON.parse(cached) as T;
      } catch {
        // Fallback DB nếu cache tạm thời gián đoạn
      }
    }
    const fresh = await loader();
    if (process.env.NODE_ENV !== 'test') {
      await setCache(cacheKey, JSON.stringify(fresh), MULTI_DASHBOARD_CACHE_TTL).catch(() => {});
    }
    return fresh;
  }

  /**
   * Helper phân giải mốc thời gian kỳ hiện tại và kỳ trước để tính delta so sánh
   */
  private resolvePeriodDates(periodKey: DashboardPeriodKey, start?: string, end?: string) {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (periodKey === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (periodKey === '30days') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
    } else if (periodKey === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (periodKey === 'custom' && start && end) {
      startDate = new Date(start);
      endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Mặc định 7days
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
    }

    const durationMs = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - durationMs);

    return { startDate, endDate, prevStartDate, prevEndDate };
  }

  /**
   * 1. Dashboard Quản Trị Viên (Admin)
   */
  async getAdminDashboard(periodKey: DashboardPeriodKey = '7days', start?: string, end?: string): Promise<DashboardResponseData> {
    const cacheKey = `multi_dash:admin:${periodKey}:${start || ''}:${end || ''}`;
    return this.withDashboardCache(cacheKey, async () => {
      const { startDate, endDate, prevStartDate, prevEndDate } = this.resolvePeriodDates(periodKey, start, end);

    const [
      totalUsers,
      activeUsers,
      usersCreatedInPeriod,
      totalEmployees,
      totalServices,
      totalCategories,
      totalJobTypes,
      userRoleGroups,
      roles,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { is_active: true } }),
      prisma.user.count({ where: { created_at: { gte: startDate, lte: endDate } } }),
      prisma.employee.count({ where: { is_active: true } }),
      prisma.service.count(),
      prisma.serviceCategory.count(),
      prisma.jobType.count(),
      prisma.userRole.groupBy({ by: ['role_id'], _count: { user_id: true } }),
      prisma.role.findMany({ select: { id: true, name: true } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        select: { id: true, full_name: true, email: true, is_active: true, created_at: true },
      }),
    ]);

    const ROLE_LABELS_VI: Record<string, string> = {
      ADMIN: 'Quản trị viên',
      MANAGER: 'Quản lý xưởng',
      'DESK STAFF': 'Nhân viên lễ tân',
      FRONT_DESK: 'Nhân viên lễ tân',
      SA: 'Cố vấn dịch vụ (SA)',
      ADVISOR: 'Cố vấn dịch vụ',
      'SERVICE ADVISOR': 'Cố vấn dịch vụ',
      TECHNICIAN: 'Kỹ thuật viên',
      CUSTOMER: 'Khách hàng',
    };

    const roleMap = new Map(roles.map((r) => [r.id, r.name]));
    const rbacDistribution = userRoleGroups.map((g) => {
      const roleName = roleMap.get(g.role_id) || `Role #${g.role_id}`;
      const cleanKey = roleName.trim().toUpperCase();
      return {
        role: roleName,
        label: ROLE_LABELS_VI[cleanKey] || roleName,
        count: g._count.user_id,
      };
    });

    return {
      portal: 'admin',
      period: { key: periodKey, startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      kpis: [
        {
          key: 'totalUsers',
          label: 'Tổng tài khoản IAM',
          value: totalUsers,
          prevValue: totalUsers,
          format: 'number',
        },
        {
          key: 'activeUsers',
          label: 'Tài khoản hoạt động',
          value: activeUsers,
          prevValue: totalUsers > 0 ? totalUsers : 1,
          format: 'number',
          unit: 'người dùng',
        },
        {
          key: 'totalEmployees',
          label: 'Nhân sự kỹ thuật',
          value: totalEmployees,
          format: 'number',
          unit: 'nhân viên',
        },
        {
          key: 'totalServices',
          label: 'Dịch vụ niêm yết',
          value: totalServices,
          format: 'number',
          unit: 'dịch vụ',
        },
      ],
      charts: {
        rbacDistribution,
        serviceCategories: [
          { name: 'Danh mục dịch vụ', count: totalCategories },
          { name: 'Loại công việc', count: totalJobTypes },
        ],
      },
      actionableList: recentUsers.map((u) => ({
        id: u.id,
        title: u.full_name,
        subtitle: u.email,
        status: u.is_active ? 'ACTIVE' : 'INACTIVE',
        timestamp: u.created_at,
      })),
    };
    });
  }

  /**
   * 2. Dashboard Giám Đốc Dịch Vụ (Manager)
   */
  async getManagerDashboard(periodKey: DashboardPeriodKey = '7days', start?: string, end?: string): Promise<DashboardResponseData> {
    const cacheKey = `multi_dash:manager:${periodKey}:${start || ''}:${end || ''}`;
    return this.withDashboardCache(cacheKey, async () => {
      const { startDate, endDate, prevStartDate, prevEndDate } = this.resolvePeriodDates(periodKey, start, end);

    const now = new Date();
    const overdueThreshold = new Date(now.getTime() - 8 * 60 * 60 * 1000);
    const activeWoStatuses = [
      WorkOrderStatus.IN_PLANNING,
      WorkOrderStatus.PENDING_APPROVAL,
      WorkOrderStatus.APPROVED,
      WorkOrderStatus.IN_PROGRESS,
      WorkOrderStatus.BILLING_REQUESTED,
      WorkOrderStatus.FINANCIAL_CLEARED,
    ];

    const [
      currRevenueAgg,
      prevRevenueAgg,
      activeWorkOrders,
      overdueJobs,
      invoices,
      statusGroups,
      actionableWos,
    ] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { total_amount: true },
        where: { status: InvoiceStatus.PAID, issued_at: { gte: startDate, lte: endDate } },
      }),
      prisma.invoice.aggregate({
        _sum: { total_amount: true },
        where: { status: InvoiceStatus.PAID, issued_at: { gte: prevStartDate, lte: prevEndDate } },
      }),
      prisma.workOrder.count({ where: { status: { in: activeWoStatuses } } }),
      prisma.job.count({
        where: {
          status: { in: [JobStatus.PLANNED, JobStatus.IN_PROGRESS] },
          started_at: { not: null, lt: overdueThreshold },
        },
      }),
      prisma.invoice.findMany({
        where: { status: InvoiceStatus.PAID, issued_at: { gte: startDate, lte: endDate } },
        select: { issued_at: true, total_amount: true },
        orderBy: { issued_at: 'asc' },
      }),
      prisma.workOrder.groupBy({
        by: ['status'],
        where: { status: { in: activeWoStatuses } },
        _count: { id: true },
      }),
      prisma.workOrder.findMany({
        where: { status: { in: activeWoStatuses } },
        take: 10,
        orderBy: { updated_at: 'desc' },
        include: {
          customer: { select: { full_name: true } },
          vehicle: { select: { license_plate: true, make: true, model: true } },
          advisor: { select: { full_name: true } },
        },
      }),
    ]);

    const totalRevenue = Number(currRevenueAgg._sum.total_amount || 0);
    const prevRevenue = Number(prevRevenueAgg._sum.total_amount || 0);

    // Gom nhóm trend doanh thu theo ngày
    const trendMap: Record<string, { label: string; value: number; count: number }> = {};
    for (const inv of invoices) {
      if (!inv.issued_at) continue;
      const key = inv.issued_at.toISOString().slice(5, 10); // MM-DD
      if (!trendMap[key]) trendMap[key] = { label: key, value: 0, count: 0 };
      trendMap[key].value += Number(inv.total_amount);
      trendMap[key].count += 1;
    }

    const distribution = statusGroups.map((sg) => ({
      category: sg.status,
      count: sg._count.id,
    }));

    return {
      portal: 'manager',
      period: { key: periodKey, startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      kpis: [
        {
          key: 'totalRevenue',
          label: 'Doanh thu quyết toán',
          value: totalRevenue,
          prevValue: prevRevenue,
          format: 'currency',
        },
        {
          key: 'activeWorkOrders',
          label: 'Lệnh xe đang xử lý',
          value: activeWorkOrders,
          format: 'number',
          unit: 'lệnh',
        },
        {
          key: 'overdueJobs',
          label: 'Công việc quá hạn SLA',
          value: overdueJobs,
          format: 'number',
          trendInverted: true,
          unit: 'vi phạm',
        },
      ],
      charts: {
        trend: Object.values(trendMap),
        distribution,
      },
      actionableList: actionableWos.map((wo) => ({
        id: wo.id,
        woNumber: wo.wo_number,
        customerName: wo.customer.full_name,
        vehiclePlate: wo.vehicle.license_plate,
        advisorName: wo.advisor.full_name,
        status: wo.status,
        updatedAt: wo.updated_at,
      })),
    };
    });
  }

  /**
   * 3. Dashboard Cố Vấn Dịch Vụ (Service Advisor) - Cá nhân hóa tuyệt đối theo userId
   */
  async getSaDashboard(
    userId: number,
    periodKey: DashboardPeriodKey = '7days',
    start?: string,
    end?: string
  ): Promise<DashboardResponseData> {
    const cacheKey = `multi_dash:sa:${userId}:${periodKey}:${start || ''}:${end || ''}`;
    return this.withDashboardCache(cacheKey, async () => {
    const { startDate, endDate, prevStartDate, prevEndDate } = this.resolvePeriodDates(periodKey, start, end);
    const saWhere = { advisor_id: userId };

    const activeWoStatuses: WorkOrderStatus[] = [
      WorkOrderStatus.DRAFT,
      WorkOrderStatus.IN_PLANNING,
      WorkOrderStatus.PENDING_APPROVAL,
      WorkOrderStatus.APPROVED,
      WorkOrderStatus.IN_PROGRESS,
      WorkOrderStatus.BILLING_REQUESTED,
      WorkOrderStatus.FINANCIAL_CLEARED,
    ];

    const [
      currRevenueAgg,
      prevRevenueAgg,
      currQuotationGroups,
      prevQuotationGroups,
      currCompletedWos,
      prevCompletedWos,
      statusGroups,
      sourceGroups,
      periodPaidInvoices,
      activeWos,
    ] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { total_amount: true },
        where: {
          status: InvoiceStatus.PAID,
          work_order: saWhere,
          issued_at: { gte: startDate, lte: endDate },
        },
      }),
      prisma.invoice.aggregate({
        _sum: { total_amount: true },
        where: {
          status: InvoiceStatus.PAID,
          work_order: saWhere,
          issued_at: { gte: prevStartDate, lte: prevEndDate },
        },
      }),
      prisma.quotation.groupBy({
        by: ['status'],
        where: {
          work_order: saWhere,
          created_at: { gte: startDate, lte: endDate },
          status: { in: ['SENT', 'APPROVED', 'REJECTED'] },
        },
        _count: { id: true },
      }),
      prisma.quotation.groupBy({
        by: ['status'],
        where: {
          work_order: saWhere,
          created_at: { gte: prevStartDate, lte: prevEndDate },
          status: { in: ['SENT', 'APPROVED', 'REJECTED'] },
        },
        _count: { id: true },
      }),
      prisma.workOrder.count({
        where: {
          ...saWhere,
          status: WorkOrderStatus.CLOSED,
          closed_at: { gte: startDate, lte: endDate },
        },
      }),
      prisma.workOrder.count({
        where: {
          ...saWhere,
          status: WorkOrderStatus.CLOSED,
          closed_at: { gte: prevStartDate, lte: prevEndDate },
        },
      }),
      prisma.workOrder.groupBy({
        by: ['status'],
        where: saWhere,
        _count: { id: true },
      }),
      prisma.workOrder.groupBy({
        by: ['source_type'],
        where: {
          ...saWhere,
          created_at: { gte: startDate, lte: endDate },
        },
        _count: { id: true },
      }),
      prisma.invoice.findMany({
        where: {
          status: InvoiceStatus.PAID,
          work_order: saWhere,
          issued_at: { gte: startDate, lte: endDate },
        },
        select: { issued_at: true, total_amount: true },
        orderBy: { issued_at: 'asc' },
      }),
      prisma.workOrder.findMany({
        where: {
          ...saWhere,
          status: { in: [...activeWoStatuses, WorkOrderStatus.CLOSED] },
        },
        take: 50,
        orderBy: { updated_at: 'desc' },
        include: {
          customer: { select: { full_name: true, phone: true } },
          vehicle: { select: { license_plate: true, make: true, model: true } },
        },
      }),
    ]);

    const personalRevenue = Number(currRevenueAgg._sum.total_amount || 0);
    const prevPersonalRevenue = Number(prevRevenueAgg._sum.total_amount || 0);

    const calcApprovalStats = (groups: Array<{ status: string; _count: { id: number } }>) => {
      const map: Record<string, number> = {};
      for (const g of groups) {
        map[g.status] = g._count.id;
      }
      const approved = map['APPROVED'] || 0;
      const total = approved + (map['REJECTED'] || 0) + (map['SENT'] || 0);
      const rate = total > 0 ? Math.round((approved / total) * 100) : 0;
      return { approved, total, rate };
    };

    const currQuoteStats = calcApprovalStats(currQuotationGroups);
    const prevQuoteStats = calcApprovalStats(prevQuotationGroups);

    const statusCountMap: Record<string, number> = {};
    for (const sg of statusGroups) {
      statusCountMap[sg.status] = sg._count.id;
    }

    const activeWosCount = activeWoStatuses.reduce((sum, st) => sum + (statusCountMap[st] || 0), 0);

    const stageOrder: WorkOrderStatus[] = [
      WorkOrderStatus.DRAFT,
      WorkOrderStatus.IN_PLANNING,
      WorkOrderStatus.PENDING_APPROVAL,
      WorkOrderStatus.APPROVED,
      WorkOrderStatus.IN_PROGRESS,
      WorkOrderStatus.BILLING_REQUESTED,
      WorkOrderStatus.FINANCIAL_CLEARED,
      WorkOrderStatus.CLOSED,
    ];

    const stagePipeline = stageOrder.map((status) => ({
      status,
      count: statusCountMap[status] || 0,
    }));

    const distribution = activeWoStatuses
      .map((status) => ({
        category: status,
        count: statusCountMap[status] || 0,
      }))
      .filter((item) => item.count > 0);

    const sourceCountMap: Record<string, number> = {};
    let totalPeriodIntake = 0;
    for (const sg of sourceGroups) {
      sourceCountMap[sg.source_type] = sg._count.id;
      totalPeriodIntake += sg._count.id;
    }

    const sourceBreakdown = (['APPOINTMENT', 'WALK_IN', 'TOW_IN'] as const).map((sourceType) => {
      const count = sourceCountMap[sourceType] || 0;
      return {
        sourceType,
        count,
        pct: totalPeriodIntake > 0 ? Math.round((count / totalPeriodIntake) * 100) : 0,
      };
    });

    const trendMap: Record<string, { label: string; value: number; count: number }> = {};
    for (const inv of periodPaidInvoices) {
      if (!inv.issued_at) continue;
      const key = inv.issued_at.toISOString().slice(5, 10);
      if (!trendMap[key]) trendMap[key] = { label: key, value: 0, count: 0 };
      trendMap[key].value += Number(inv.total_amount);
      trendMap[key].count += 1;
    }

    return {
      portal: 'sa',
      period: { key: periodKey, startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      kpis: [
        {
          key: 'personalRevenue',
          label: 'Doanh thu cá nhân',
          value: personalRevenue,
          prevValue: prevPersonalRevenue,
          format: 'currency',
        },
        {
          key: 'quotationApprovalRate',
          label: 'Tỷ lệ chốt báo giá',
          value: currQuoteStats.rate,
          prevValue: prevQuoteStats.rate,
          format: 'percent',
          unit: '%',
        },
        {
          key: 'completedWos',
          label: 'Hồ sơ hoàn tất',
          value: currCompletedWos,
          prevValue: prevCompletedWos,
          format: 'number',
          unit: 'hồ sơ',
        },
        {
          key: 'activeWosCount',
          label: 'Hồ sơ đang phụ trách',
          value: activeWosCount,
          format: 'number',
          unit: 'hồ sơ',
        },
      ],
      charts: {
        distribution,
        stagePipeline,
        sourceBreakdown,
        revenueTrend: Object.values(trendMap),
        summary: {
          pendingApprovalCount: statusCountMap[WorkOrderStatus.PENDING_APPROVAL] || 0,
          inInspectionCount:
            (statusCountMap[WorkOrderStatus.DRAFT] || 0) + (statusCountMap[WorkOrderStatus.IN_PLANNING] || 0),
          inProgressCount: statusCountMap[WorkOrderStatus.IN_PROGRESS] || 0,
          handoverReadyCount: statusCountMap[WorkOrderStatus.FINANCIAL_CLEARED] || 0,
          approvedQuotations: currQuoteStats.approved,
          totalQuotations: currQuoteStats.total,
          totalPeriodIntake,
        },
      },
      actionableList: activeWos.map((wo) => ({
        id: wo.id,
        woNumber: wo.wo_number,
        customerName: wo.customer.full_name,
        customerPhone: wo.customer.phone,
        vehiclePlate: wo.vehicle.license_plate,
        vehicleModel: `${wo.vehicle.make} ${wo.vehicle.model}`,
        status: wo.status,
        updatedAt: wo.updated_at,
      })),
    };
    });
  }

  /**
   * 4. Dashboard Nhân Viên / Kỹ Thuật Viên (Staff)
   */
  async getStaffDashboard(
    userId: number,
    scope: DashboardScope = 'my',
    periodKey: DashboardPeriodKey = '7days',
    start?: string,
    end?: string
  ): Promise<DashboardResponseData> {
    const cacheKey = `multi_dash:staff:${scope}:${scope === 'my' ? userId : 'all'}:${periodKey}:${start || ''}:${end || ''}`;
    return this.withDashboardCache(cacheKey, async () => {
    const { startDate, endDate } = this.resolvePeriodDates(periodKey, start, end);

    // Tìm employee_id nếu có
    const employee = await prisma.employee.findUnique({
      where: { user_id: userId },
      select: { id: true },
    });

    const jobWhere: any = {
      ...(scope === 'my' && employee ? { job_labours: { some: { employee_id: employee.id } } } : {}),
    };

    const [
      appointmentsToday,
      activeJobsCount,
      completedTodayCount,
      lowStockCount,
      myJobsList,
    ] = await Promise.all([
      prisma.appointment.count({
        where: { scheduled_date: { gte: startDate, lte: endDate } },
      }),
      prisma.job.count({
        where: {
          ...jobWhere,
          status: { in: [JobStatus.PLANNED, JobStatus.IN_PROGRESS] },
        },
      }),
      prisma.job.count({
        where: {
          ...jobWhere,
          status: JobStatus.COMPLETED,
          completed_at: { gte: startDate, lte: endDate },
        },
      }),
      prisma.inventoryItem.count({
        where: { is_active: true },
      }),
      prisma.job.findMany({
        where: {
          ...jobWhere,
          status: { in: [JobStatus.PLANNED, JobStatus.IN_PROGRESS] },
        },
        take: 10,
        orderBy: { updated_at: 'desc' },
        include: {
          wo_service: {
            include: {
              work_order: {
                select: {
                  id: true,
                  wo_number: true,
                  vehicle: { select: { license_plate: true, make: true, model: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      portal: 'staff',
      period: { key: periodKey, startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      kpis: [
        {
          key: 'activeJobsCount',
          label: 'Công việc đang đảm nhiệm',
          value: activeJobsCount,
          format: 'number',
          unit: 'công việc',
        },
        {
          key: 'completedTodayCount',
          label: 'Hoàn thành trong kỳ',
          value: completedTodayCount,
          format: 'number',
          unit: 'xong',
        },
        {
          key: 'appointmentsToday',
          label: 'Lượng xe tiếp nhận theo lịch',
          value: appointmentsToday,
          format: 'number',
          unit: 'lượt',
        },
        {
          key: 'lowStockCount',
          label: 'Mặt hàng trong kho',
          value: lowStockCount,
          format: 'number',
          unit: 'phụ tùng',
        },
      ],
      charts: {
        jobStatus: [
          { category: 'Đang làm', count: activeJobsCount },
          { category: 'Đã hoàn thành', count: completedTodayCount },
        ],
      },
      actionableList: myJobsList.map((j) => ({
        id: j.id,
        name: j.name,
        status: j.status,
        estimatedHours: j.estimated_hours,
        startedAt: j.started_at,
        woNumber: j.wo_service.work_order.wo_number,
        vehiclePlate: j.wo_service.work_order.vehicle.license_plate,
      })),
    };
    });
  }
}

export const multiDashboardService = new MultiDashboardService();
