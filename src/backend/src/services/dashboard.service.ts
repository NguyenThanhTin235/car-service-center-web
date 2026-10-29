import prisma from '../utils/prisma';
import { WorkOrderStatus, JobStatus } from '@prisma/client';

const ACTIVE_WO_STATUSES: WorkOrderStatus[] = [
  WorkOrderStatus.IN_PLANNING,
  WorkOrderStatus.PENDING_APPROVAL,
  WorkOrderStatus.APPROVED,
  WorkOrderStatus.IN_PROGRESS,
  WorkOrderStatus.BILLING_REQUESTED,
  WorkOrderStatus.FINANCIAL_CLEARED,
];

class DashboardService {
  async getWorkshopDashboard() {
    const activeWorkOrders = await prisma.workOrder.findMany({
      where: { status: { in: ACTIVE_WO_STATUSES } },
      include: {
        customer: { select: { id: true, full_name: true } },
        vehicle: { select: { license_plate: true, make: true, model: true, year: true } },
        advisor: { select: { id: true, full_name: true } },
        services: {
          include: {
            service: { select: { name: true } },
            jobs: {
              select: {
                id: true,
                name: true,
                status: true,
                started_at: true,
                estimated_hours: true,
              },
            },
          },
          orderBy: { sort_order: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const now = new Date();
    const overdueThreshold = new Date(now.getTime() - 8 * 60 * 60 * 1000);

    const [totalActive, pendingApproval, billingRequested, overdueJobs] = await Promise.all([
      prisma.workOrder.count({ where: { status: { in: ACTIVE_WO_STATUSES } } }),
      prisma.workOrder.count({ where: { status: WorkOrderStatus.PENDING_APPROVAL } }),
      prisma.workOrder.count({ where: { status: WorkOrderStatus.BILLING_REQUESTED } }),
      prisma.job.count({
        where: {
          status: { in: [JobStatus.PLANNED, JobStatus.IN_PROGRESS] },
          started_at: { not: null, lt: overdueThreshold },
          wo_service: { work_order: { status: { in: ACTIVE_WO_STATUSES } } },
        },
      }),
    ]);

    const workOrders = activeWorkOrders.map((wo) => ({
      id: wo.id,
      woNumber: wo.wo_number,
      status: wo.status,
      customerName: wo.customer.full_name,
      vehiclePlate: wo.vehicle.license_plate,
      vehicleInfo: `${wo.vehicle.make} ${wo.vehicle.model} ${wo.vehicle.year ?? ''}`.trim(),
      advisorName: wo.advisor.full_name,
      createdAt: wo.created_at,
      services: wo.services.map((s) => ({
        id: s.id,
        name: s.service?.name ?? s.name,
        status: s.status,
        jobs: s.jobs.map((j) => {
          const isOverdue =
            j.started_at !== null &&
            (j.status === JobStatus.PLANNED || j.status === JobStatus.IN_PROGRESS) &&
            j.started_at < overdueThreshold;
          return { id: j.id, name: j.name, status: j.status, isOverdue, startedAt: j.started_at };
        }),
      })),
    }));

    return { kpis: { totalActive, pendingApproval, billingRequested, overdueJobs }, workOrders };
  }
}

export const dashboardService = new DashboardService();
