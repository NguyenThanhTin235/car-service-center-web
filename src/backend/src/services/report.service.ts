import prisma from '../utils/prisma';
import { InvoiceStatus, MovementType, WorkOrderType } from '@prisma/client';
import {
  WarrantyReportFilterDto,
  WarrantyReportResult,
  TopFaultyPartItem,
  TechnicianWarrantyAnalysis,
  CategoryWarrantyAnalysis,
} from '../dtos/report.dto';

type ReportType = 'revenue' | 'services' | 'inventory';

class ReportService {
  async getOperationalReport(type: ReportType, start?: string, end?: string) {
    switch (type) {
      case 'revenue':   return this.getRevenueReport(start, end);
      case 'services':  return this.getServicesReport(start, end);
      case 'inventory': return this.getInventoryReport();
      default: throw new Error('Loai bao cao khong hop le');
    }
  }

  private async getRevenueReport(start?: string, end?: string) {
    const startDate = start ? new Date(start) : this.defaultStartDate();
    const endDate = end ? new Date(end) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const invoices = await prisma.invoice.findMany({
      where: { status: InvoiceStatus.PAID, issued_at: { gte: startDate, lte: endDate } },
      select: { id: true, invoice_number: true, total_amount: true, issued_at: true },
      orderBy: { issued_at: 'asc' },
    });

    const byDate: Record<string, { date: string; totalRevenue: number; count: number }> = {};
    for (const inv of invoices) {
      if (!inv.issued_at) continue;
      const dateKey = inv.issued_at.toISOString().slice(0, 10);
      if (!byDate[dateKey]) byDate[dateKey] = { date: dateKey, totalRevenue: 0, count: 0 };
      byDate[dateKey].totalRevenue += Number(inv.total_amount);
      byDate[dateKey].count += 1;
    }

    const data = Object.values(byDate);
    const totalRevenue = invoices.reduce((sum: number, i) => sum + Number(i.total_amount), 0);
    return {
      type: 'revenue', period: { start: startDate.toISOString(), end: endDate.toISOString() },
      data, summary: { totalRevenue, totalInvoices: invoices.length },
    };
  }

  private async getServicesReport(start?: string, end?: string) {
    const startDate = start ? new Date(start) : this.defaultStartDate();
    const endDate = end ? new Date(end) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const grouped = await prisma.woService.groupBy({
      by: ['service_id'],
      where: { work_order: { created_at: { gte: startDate, lte: endDate } }, service_id: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const serviceIds = grouped.map((g) => g.service_id).filter((id): id is number => id !== null);
    const services = await prisma.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true, name: true } });
    const serviceMap = new Map(services.map((s) => [s.id, s.name]));

    const data = grouped.map((g) => ({
      serviceId: g.service_id,
      serviceName: g.service_id ? (serviceMap.get(g.service_id) ?? 'Khong ro') : 'Khong ro',
      count: g._count.id,
    }));

    return {
      type: 'services', period: { start: startDate.toISOString(), end: endDate.toISOString() },
      data, summary: { totalWorkOrders: data.reduce((s: number, d) => s + d.count, 0) },
    };
  }

  private async getInventoryReport() {
    const lowStockItems = await prisma.inventoryItem.findMany({
      where: { is_active: true },
      include: { part_category: { select: { name: true, code: true } }, brand: { select: { name: true } } },
      orderBy: { on_hand: 'asc' },
    });

    const filtered = lowStockItems.filter((item) => item.on_hand <= item.reorder_level);
    const data = filtered.map((item) => ({
      id: item.id, sku: item.sku,
      name: item.brand ? `${item.part_category.name} - ${item.brand.name}` : item.part_category.name,
      categoryName: item.part_category.name,
      onHand: item.on_hand, reorderLevel: item.reorder_level,
      deficit: item.reorder_level - item.on_hand,
    }));

    return { type: 'inventory', period: null, data, summary: { lowStockCount: data.length } };
  }

  /**
   * UC-87: Báo cáo Thống kê & Phân tích Quản trị Bảo hành
   * Chỉ duy nhất Quản lý dịch vụ hoặc Quản trị viên hệ thống có quyền xem.
   */
  async getWarrantyReport(
    filters: WarrantyReportFilterDto = {},
    userRoles?: string[]
  ): Promise<WarrantyReportResult> {
    // 1. Phân quyền chặt chẽ (RBAC)
    if (userRoles) {
      const allowedRoles = ['SERVICE_MANAGER', 'SYSTEM_ADMIN', 'ADMIN', 'MANAGER'];
      const hasPermission = userRoles.some((r) => allowedRoles.includes(r.toUpperCase()));
      if (!hasPermission) {
        throw new Error('Bạn không có quyền truy cập dữ liệu báo cáo tài chính và chất lượng của xưởng.');
      }
    }

    // 2. Xử lý & Kiểm tra khoảng thời gian (startDate <= endDate)
    let startDate: Date;
    if (filters.startDate) {
      startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate = this.defaultStartDate();
    }

    let endDate: Date;
    if (filters.endDate) {
      endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    if (startDate.getTime() > endDate.getTime()) {
      throw new Error('Khoảng thời gian không hợp lệ. Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.');
    }

    // 3. Chỉ số Vận hành (Operational Metrics)
    const [totalServedCount, warrantyCasesCount] = await Promise.all([
      prisma.workOrder.count({
        where: {
          created_at: { gte: startDate, lte: endDate },
        },
      }),
      prisma.workOrder.count({
        where: {
          order_type: { in: [WorkOrderType.WARRANTY, WorkOrderType.MIXED] },
          created_at: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    const warrantyRate =
      totalServedCount > 0
        ? Number(((warrantyCasesCount / totalServedCount) * 100).toFixed(2))
        : 0;

    // 4. Lấy danh sách các lệnh bảo hành (WARRANTY & MIXED) và phụ tùng bảo hành trong kỳ
    const warrantyWorkOrders = await prisma.workOrder.findMany({
      where: {
        order_type: { in: [WorkOrderType.WARRANTY, WorkOrderType.MIXED] },
        created_at: { gte: startDate, lte: endDate },
      },
      include: {
        vehicle: true,
        parent_work_order: {
          include: {
            services: {
              include: {
                jobs: {
                  include: {
                    labours: {
                      include: {
                        employee: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        services: {
          include: {
            service: {
              include: {
                category: true,
              },
            },
            jobs: {
              include: {
                labours: {
                  include: {
                    employee: true,
                  },
                },
                parts: {
                  include: {
                    item: {
                      include: {
                        part_category: true,
                        brand: true,
                      },
                    },
                    movements: {
                      where: {
                        movement_type: MovementType.ISSUE,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // 5. Chi phí Vốn Thiệt hại (MWA Cost) & Thống kê Phụ tùng lỗi
    let totalWarrantyMwaCost = 0;
    let totalPartsQuantity = 0;

    // Map phụ tùng: itemId -> thông tin tích lũy
    const faultyPartsMap = new Map<
      number,
      {
        itemId: number;
        sku: string;
        partName: string;
        categoryName: string;
        faultyCount: number;
        totalWarrantyMwaCost: number;
      }
    >();

    // Phân tích nhóm dịch vụ: categoryId -> thông tin tích lũy
    const categoryAnalysisMap = new Map<
      number,
      {
        categoryId: number;
        categoryName: string;
        warrantyCasesCount: number;
        totalWarrantyMwaCost: number;
      }
    >();

    // Duyệt qua từng WorkOrder bảo hành
    for (const wo of warrantyWorkOrders) {
      for (const woService of wo.services) {
        const cat = woService.service?.category;
        if (cat) {
          const currentCat = categoryAnalysisMap.get(cat.id) || {
            categoryId: cat.id,
            categoryName: cat.name,
            warrantyCasesCount: 0,
            totalWarrantyMwaCost: 0,
          };
          currentCat.warrantyCasesCount += 1;
          categoryAnalysisMap.set(cat.id, currentCat);
        }

        for (const job of woService.jobs) {
          const isWarrantyOrderOrJob = wo.order_type === WorkOrderType.WARRANTY || Boolean(job.is_warranty);
          for (const part of job.parts) {
            if (part.status === 'RETURNED') continue;
            if (!isWarrantyOrderOrJob && !part.is_warranty) continue;
            // Xác định số lượng xuất và chi phí MWA xuất kho
            let partQty = 0;
            let partMwaCost = 0;

            if (part.movements && part.movements.length > 0) {
              for (const m of part.movements) {
                const qty = Number(m.quantity);
                const cost = qty * Number(m.unit_cost);
                partQty += qty;
                partMwaCost += cost;
              }
            } else {
              // Fallback nếu chưa tạo movement (dùng issued_quantity hoặc planned_quantity và average_cost)
              const qty = Number(part.issued_quantity) > 0 ? Number(part.issued_quantity) : Number(part.planned_quantity) || 1;
              const cost = qty * Number(part.item?.average_cost || 0);
              partQty += qty;
              partMwaCost += cost;
            }

            totalWarrantyMwaCost += partMwaCost;
            totalPartsQuantity += partQty;

            // Cộng dồn chi phí vào Category
            if (cat) {
              const currentCat = categoryAnalysisMap.get(cat.id)!;
              currentCat.totalWarrantyMwaCost += partMwaCost;
            }

            // Cộng dồn vào danh mục phụ tùng lỗi
            const item = part.item;
            if (item) {
              const currentPart = faultyPartsMap.get(item.id) || {
                itemId: item.id,
                sku: item.sku,
                partName: item.brand
                  ? `${item.part_category.name} - ${item.brand.name}`
                  : item.part_category.name,
                categoryName: item.part_category.name,
                faultyCount: 0,
                totalWarrantyMwaCost: 0,
              };
              currentPart.faultyCount += partQty;
              currentPart.totalWarrantyMwaCost += partMwaCost;
              faultyPartsMap.set(item.id, currentPart);
            }
          }
        }
      }
    }

    // 6. Truy vấn thông tin Nhà cung cấp (Supplier) cho các phụ tùng lỗi
    const itemIds = Array.from(faultyPartsMap.keys());
    const supplierInfoMap = new Map<number, any>();

    if (itemIds.length > 0) {
      const receiptItems = await prisma.goodsReceiptItem.findMany({
        where: { item_id: { in: itemIds } },
        include: {
          receipt: {
            include: {
              supplier: true,
            },
          },
        },
        orderBy: { id: 'desc' },
      });

      for (const ri of receiptItems) {
        if (!supplierInfoMap.has(ri.item_id) && ri.receipt?.supplier) {
          supplierInfoMap.set(ri.item_id, ri.receipt.supplier);
        }
      }
    }

    // Chuẩn hóa danh sách top phụ tùng lỗi
    const topFaultyParts: TopFaultyPartItem[] = Array.from(faultyPartsMap.values())
      .map((p) => {
        const sup = supplierInfoMap.get(p.itemId);
        const defectRate =
          totalPartsQuantity > 0
            ? Number(((p.faultyCount / totalPartsQuantity) * 100).toFixed(2))
            : 0;

        return {
          itemId: p.itemId,
          sku: p.sku,
          partName: p.partName,
          categoryName: p.categoryName,
          faultyCount: p.faultyCount,
          totalWarrantyMwaCost: Number(p.totalWarrantyMwaCost.toFixed(2)),
          defectRate,
          supplier: {
            supplierId: sup?.id ?? null,
            supplierName: sup?.name ?? 'Chưa xác định',
            supplierPhone: sup?.phone ?? null,
            supplierEmail: sup?.email ?? null,
            supplierContact: sup?.contact_person ?? null,
          },
        };
      })
      .sort((a, b) => b.faultyCount - a.faultyCount);

    // 7. Phân tích lỗi kỹ thuật lặp lại theo Kỹ thuật viên (Technician Analysis)
    const technicianMap = new Map<number, TechnicianWarrantyAnalysis>();

    for (const wo of warrantyWorkOrders) {
      // Ưu tiên trích xuất thợ thi công từ lệnh gốc parent_work_order
      const targetWo = wo.parent_work_order || wo;
      const associatedTechs = new Map<number, { id: number; name: string; position?: string }>();

      for (const woService of targetWo.services || []) {
        for (const job of woService.jobs || []) {
          for (const labour of job.labours || []) {
            if (labour.employee) {
              associatedTechs.set(labour.employee.id, {
                id: labour.employee.id,
                name: labour.employee.full_name,
                position: labour.employee.position || undefined,
              });
            }
          }
        }
      }

      // Ghi nhận vụ bảo hành cho các kỹ thuật viên liên quan
      for (const tech of associatedTechs.values()) {
        const currentTech = technicianMap.get(tech.id) || {
          technicianId: tech.id,
          technicianName: tech.name,
          position: tech.position,
          warrantyCasesCount: 0,
          workOrders: [],
        };

        currentTech.warrantyCasesCount += 1;
        currentTech.workOrders.push({
          warrantyWoId: wo.id,
          warrantyWoNumber: wo.wo_number,
          parentWoId: wo.parent_work_order_id,
          parentWoNumber: wo.parent_work_order?.wo_number ?? null,
          licensePlate: wo.vehicle?.license_plate,
          createdAt: wo.created_at.toISOString(),
        });

        technicianMap.set(tech.id, currentTech);
      }
    }

    const byTechnician = Array.from(technicianMap.values()).sort(
      (a, b) => b.warrantyCasesCount - a.warrantyCasesCount
    );

    const byCategory: CategoryWarrantyAnalysis[] = Array.from(categoryAnalysisMap.values())
      .map((c) => ({
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        warrantyCasesCount: c.warrantyCasesCount,
        totalWarrantyMwaCost: Number(c.totalWarrantyMwaCost.toFixed(2)),
      }))
      .sort((a, b) => b.warrantyCasesCount - a.warrantyCasesCount);

    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      operationalMetrics: {
        totalServedCount,
        warrantyCasesCount,
        warrantyRate,
      },
      costMetrics: {
        totalWarrantyMwaCost: Number(totalWarrantyMwaCost.toFixed(2)),
        totalPartsQuantity,
      },
      topFaultyParts,
      technicalAnalysis: {
        byTechnician,
        byCategory,
      },
    };
  }

  private defaultStartDate(): Date {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}

export const reportService = new ReportService();
