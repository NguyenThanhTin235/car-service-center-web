import prisma from '../../utils/prisma';
import { getCache, setCache } from '../../utils/redis.util';
import {
  CatalogContext,
  CustomerPrivateContext,
  DerivedWarrantyRecord,
  QuotationSummary,
} from './ai-customer-chat.types';

export const CATALOG_CACHE_KEY = 'catalog:ai_chat:context:v3';
export const CATALOG_CACHE_TTL_SECONDS = 300;

export const GARAGE_STATIC_INFO: CatalogContext['garageInfo'] = {
  name: 'AutoCare Pro',
  address: 'Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh',
  hotline: '1900 6868',
  workingDays: 'Thứ 2 - Thứ 7 (Nghỉ Chủ nhật)',
  workingHours:
    '08:00 - 18:00 (Thứ 2 - Thứ 7, Nghỉ Chủ nhật — áp dụng cho cả Giờ tiếp nhận xe tại xưởng và Tổng đài cố vấn 1900 6868)',
  bookingSlots: {
    morning: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30'],
    afternoon: ['13:30', '14:00', '14:30', '15:00', '16:00'],
  },
  vatPolicy: 'Chính sách miễn thuế GTGT (0% VAT)',
  processSteps: [
    '1. Tiếp nhận - Kiểm tra xe: Cố vấn dịch vụ ghi nhận tình trạng ngoại thất, số km ODO và lưu ảnh hiện trạng ngay lúc nhận xe.',
    '2. Lên kế hoạch công việc: Khảo sát hạng mục cần xử lý, dự kiến thời gian, phân bổ khoang sửa chữa và nguồn phụ tùng.',
    '3. Lập báo giá chi tiết: Tách bạch tiền công kỹ thuật và từng mã phụ tùng kèm đơn giá rõ ràng (0% VAT) trước khi tiến hành sửa chữa.',
    '4. Phê duyệt trực tuyến: Chủ xe xem báo giá, đặt câu hỏi hoặc nhấn xác nhận phê duyệt ngay trên điện thoại.',
    '5. Thi công: Kỹ thuật viên thực hiện theo đúng hạng mục đã duyệt và cập nhật trạng thái trực tiếp qua cổng khách hàng.',
    '6. Kiểm định chất lượng: Đội ngũ kiểm tra xuất xưởng (KCS) nghiệm thu từng đầu việc an toàn trước khi hoàn tất sửa chữa.',
    '7. Thanh toán trực tuyến: Quét mã QR SePay đối soát tự động hoặc thanh toán tại quầy, xuất hóa đơn PDF chuẩn mực.',
    '8. Bàn giao xe: Bàn giao xe cho chủ xe, lưu lịch sử bảo dưỡng điện tử và ghi nhận mốc chăm sóc kỳ tiếp theo.',
  ],
};

/**
 * Pure deterministic calculator for cumulative quotation totals on a WorkOrder.
 * Strictly excludes REJECTED and DRAFT quotations so customers never see cancelled quotes added to total.
 */
export function computeQuotationSummary(
  quotations: Array<{ id: number; status: string; grand_total: unknown }>
): QuotationSummary {
  let totalApprovedAmount = 0;
  let pendingApprovalAmount = 0;
  const pendingQuotationIds: number[] = [];

  for (const q of quotations || []) {
    const grandTotal = Number(q.grand_total) || 0;
    if (q.status === 'APPROVED') {
      totalApprovedAmount += grandTotal;
    } else if (q.status === 'SENT') {
      pendingApprovalAmount += grandTotal;
      pendingQuotationIds.push(q.id);
    }
  }

  return {
    totalApprovedAmount,
    pendingApprovalAmount,
    projectedCombinedTotal: totalApprovedAmount + pendingApprovalAmount,
    pendingQuotationIds,
  };
}

function addMonthsIso(baseDate: Date, months: number): string {
  const result = new Date(baseDate.getTime());
  result.setMonth(result.getMonth() + months);
  return result.toISOString();
}

function formatDateOnly(val: Date | string | null | undefined): string {
  if (!val) return '';
  const d = val instanceof Date ? val : new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toISOString().slice(0, 10);
}

function formatTimeOnly(val: Date | string | null | undefined): string {
  if (!val) return '';
  if (val instanceof Date) {
    return val.toISOString().slice(11, 16);
  }
  const str = String(val);
  if (str.includes('T')) return str.slice(11, 16);
  return str.slice(0, 5);
}

let inFlightCatalogPromise: Promise<CatalogContext> | null = null;
const inFlightPrivateCtxMap = new Map<number, Promise<CustomerPrivateContext | null>>();

export class AiCustomerContextBuilder {
  /**
   * Retrieve public active service catalog and garage info with 5-minute TTL caching + singleflight.
   */
  async getCatalogContext(): Promise<CatalogContext> {
    try {
      const cached = await getCache(CATALOG_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as CatalogContext;
        return { ...parsed, garageInfo: GARAGE_STATIC_INFO };
      }
    } catch (err) {
      console.warn('[AiCustomerContextBuilder] Cache read failed:', (err as Error).message);
    }

    if (inFlightCatalogPromise) {
      return inFlightCatalogPromise;
    }

    inFlightCatalogPromise = (async () => {
      const categoriesRaw = await prisma.serviceCategory.findMany({
        where: { is_active: true },
        orderBy: { sort_order: 'asc' },
        include: {
          services: {
            where: { is_active: true },
            orderBy: { id: 'asc' },
            include: {
              size_prices: true,
            },
          },
        },
      });

      const categories = (categoriesRaw || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description ?? null,
        services: (cat.services || []).map((svc: any) => ({
          id: svc.id,
          name: svc.name,
          categoryName: cat.name,
          description: svc.description ?? null,
          pricingType: svc.pricing_type,
          fixedPrice: svc.fixed_price !== null && svc.fixed_price !== undefined ? Number(svc.fixed_price) : null,
          sizePrices: (svc.size_prices || []).map((sp: any) => ({
            vehicleSize: sp.vehicle_size,
            price: Number(sp.price),
          })),
          warrantyMonths: Number(svc.warranty_months || 0),
        })),
      }));

      const catalog: CatalogContext = {
        garageInfo: GARAGE_STATIC_INFO,
        categories,
      };

      try {
        await setCache(CATALOG_CACHE_KEY, JSON.stringify(catalog), CATALOG_CACHE_TTL_SECONDS);
      } catch (err) {
        console.warn('[AiCustomerContextBuilder] Cache write failed:', (err as Error).message);
      }

      return catalog;
    })().finally(() => {
      inFlightCatalogPromise = null;
    });

    return inFlightCatalogPromise;
  }

  /**
   * Retrieve private customer context strictly scoped by authenticatedUserId from JWT + singleflight.
   * Never exposes internal DRAFT quotations, DRAFT/CANCELLED invoices, or internal-only findings.
   */
  async getCustomerPrivateContext(authenticatedUserId: number): Promise<CustomerPrivateContext | null> {
    const existing = inFlightPrivateCtxMap.get(authenticatedUserId);
    if (existing) {
      return existing;
    }

    const loadPromise = this._loadCustomerPrivateContext(authenticatedUserId).finally(() => {
      inFlightPrivateCtxMap.delete(authenticatedUserId);
    });
    inFlightPrivateCtxMap.set(authenticatedUserId, loadPromise);
    return loadPromise;
  }

  private async _loadCustomerPrivateContext(
    authenticatedUserId: number
  ): Promise<CustomerPrivateContext | null> {
    const [customer, vehiclesRaw, appointmentsRaw, activeWorkOrdersRaw, completedWorkOrdersRaw] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: authenticatedUserId },
          select: {
            id: true,
            full_name: true,
            phone: true,
            email: true,
          },
        }),
        prisma.vehicle.findMany({
          where: {
            customer_id: authenticatedUserId,
            status: 'ACTIVE',
          },
          orderBy: { updated_at: 'desc' },
          select: {
            id: true,
            license_plate: true,
            make: true,
            model: true,
            year: true,
            vehicle_size: true,
          },
        }),
        prisma.appointment.findMany({
          where: {
            customer_id: authenticatedUserId,
            status: { in: ['REQUESTED', 'CONFIRMED', 'RESCHEDULED'] },
          },
          orderBy: { scheduled_date: 'asc' },
          take: 5,
          include: {
            vehicle: {
              select: { id: true, license_plate: true, make: true, model: true },
            },
            services: {
              include: {
                service: { select: { id: true, name: true } },
              },
            },
          },
        }),
        prisma.workOrder.findMany({
          where: {
            customer_id: authenticatedUserId,
            status: { notIn: ['CLOSED', 'CANCELLED', 'RELEASED'] },
          },
          orderBy: { updated_at: 'desc' },
          take: 5,
          include: {
            vehicle: {
              select: { id: true, license_plate: true, make: true, model: true },
            },
            advisor: {
              select: { full_name: true, phone: true },
            },
            check_in: {
              select: { mileage: true, complaint: true, status: true },
            },
            services: {
              orderBy: { sort_order: 'asc' },
              include: {
                service: { select: { id: true, name: true } },
                qc_records: {
                  orderBy: { created_at: 'desc' },
                  take: 1,
                  select: { overall_result: true, created_at: true },
                },
              },
            },
            inspections: {
              include: {
                findings: {
                  where: { is_visible_to_customer: true },
                  select: {
                    id: true,
                    description: true,
                    severity: true,
                    recommendation: true,
                    part_name: true,
                    status: true,
                  },
                },
              },
            },
            quotations: {
              where: { status: { in: ['SENT', 'APPROVED', 'REJECTED'] } },
              orderBy: { created_at: 'asc' },
              include: {
                lines: {
                  orderBy: { sort_order: 'asc' },
                  select: {
                    description: true,
                    line_type: true,
                    quantity: true,
                    snapshot_unit_price: true,
                    amount: true,
                  },
                },
              },
            },
            invoices: {
              where: { status: { in: ['ISSUED', 'PAID'] } },
              orderBy: { created_at: 'desc' },
              select: {
                id: true,
                invoice_number: true,
                status: true,
                total_amount: true,
                amount_due: true,
                issued_at: true,
                paid_at: true,
              },
            },
          },
        }),
        prisma.workOrder.findMany({
          where: {
            customer_id: authenticatedUserId,
            status: { in: ['RELEASED', 'CLOSED'] },
          },
          orderBy: { updated_at: 'desc' },
          take: 15,
          include: {
            vehicle: {
              select: { id: true, license_plate: true, make: true, model: true },
            },
            check_in: {
              select: { mileage: true },
            },
            release: {
              select: { released_at: true, release_notes: true },
            },
            services: {
              include: {
                service: {
                  select: {
                    id: true,
                    name: true,
                    warranty_months: true,
                  },
                },
                jobs: {
                  include: {
                    parts: {
                      include: {
                        item: {
                          select: {
                            warranty_months: true,
                            part_category: { select: { name: true } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            invoices: {
              where: { status: { in: ['ISSUED', 'PAID'] } },
              orderBy: { created_at: 'desc' },
              select: {
                id: true,
                invoice_number: true,
                status: true,
                total_amount: true,
                amount_due: true,
              },
            },
          },
        }),
      ]);

    if (!customer) {
      return null;
    }

    const vehicles = (vehiclesRaw || []).map((v: any) => ({
      id: v.id,
      licensePlate: v.license_plate,
      make: v.make,
      model: v.model,
      year: v.year ?? null,
      vehicleSize: v.vehicle_size,
    }));

    const upcomingAppointments = (appointmentsRaw || []).map((apt: any) => ({
      id: apt.id,
      scheduledDate: formatDateOnly(apt.scheduled_date),
      scheduledTime: formatTimeOnly(apt.scheduled_time),
      status: apt.status,
      isWarranty: Boolean(apt.is_warranty),
      notes: apt.notes ?? null,
      vehicle: {
        id: apt.vehicle?.id,
        licensePlate: apt.vehicle?.license_plate,
        make: apt.vehicle?.make,
        model: apt.vehicle?.model,
      },
      serviceNames: (apt.services || [])
        .map((as: any) => as.service?.name)
        .filter(Boolean),
    }));

    const activeWorkOrders = (activeWorkOrdersRaw || []).map((wo: any) => {
      const quotations = (wo.quotations || []).map((q: any) => ({
        id: q.id,
        quotationNumber: q.quotation_number,
        quotationType: q.quotation_type,
        status: q.status,
        grandTotal: Number(q.grand_total || 0),
        lines: (q.lines || []).map((line: any) => ({
          description: line.description,
          lineType: line.line_type,
          quantity: Number(line.quantity || 0),
          unitPrice: Number(line.snapshot_unit_price || 0),
          amount: Number(line.amount || 0),
        })),
      }));

      const quotationSummary = computeQuotationSummary(wo.quotations || []);

      const findings = (wo.inspections || []).flatMap((insp: any) =>
        (insp.findings || []).map((f: any) => ({
          id: f.id,
          description: f.description,
          severity: f.severity,
          recommendation: f.recommendation ?? null,
          partName: f.part_name ?? null,
          status: f.status,
        }))
      );

      return {
        id: wo.id,
        woNumber: wo.wo_number,
        status: wo.status,
        orderType: wo.order_type,
        vehicle: {
          id: wo.vehicle?.id,
          licensePlate: wo.vehicle?.license_plate,
          make: wo.vehicle?.make,
          model: wo.vehicle?.model,
        },
        advisorName: wo.advisor?.full_name ?? null,
        advisorPhone: wo.advisor?.phone ?? null,
        mileage: wo.check_in?.mileage ?? null,
        complaint: wo.check_in?.complaint ?? null,
        services: (wo.services || []).map((s: any) => ({
          id: s.id,
          name: s.name || s.service?.name || 'Dịch vụ',
          status: s.status,
          pricingType: s.pricing_type,
          latestQcResult: s.qc_records?.[0]?.overall_result ?? null,
        })),
        findings,
        quotations,
        quotationSummary,
        invoices: (wo.invoices || []).map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoice_number,
          status: inv.status,
          totalAmount: Number(inv.total_amount || 0),
          amountDue: Number(inv.amount_due || 0),
        })),
      };
    });

    const now = new Date();
    const warrantyRecords: DerivedWarrantyRecord[] = [];
    const claimedParentWoIds = new Set<number>(
      [...(completedWorkOrdersRaw || []), ...(activeWorkOrdersRaw || [])]
        .filter((wo: any) => wo.order_type === 'WARRANTY' && wo.parent_work_order_id != null)
        .map((wo: any) => Number(wo.parent_work_order_id))
    );

    const recentCompletedOrders = (completedWorkOrdersRaw || []).map((wo: any) => {
      const baseDate = new Date(
        wo.release?.released_at || wo.closed_at || wo.updated_at || now
      );
      const baseMileage: number | null =
        wo.check_in?.mileage !== undefined && wo.check_in?.mileage !== null
          ? Number(wo.check_in.mileage)
          : null;
      const isAlreadyClaimed = claimedParentWoIds.has(Number(wo.id));

      for (const woSvc of wo.services || []) {
        const svcMonths = Number(
          (woSvc.warranty_months ?? 0) > 0 ? woSvc.warranty_months : woSvc.service?.warranty_months || 0
        );
        if (!isAlreadyClaimed && svcMonths > 0) {
          const expiresAt = addMonthsIso(baseDate, svcMonths);
          if (!expiresAt || new Date(expiresAt) >= now) {
            warrantyRecords.push({
              workOrderId: wo.id,
              woNumber: wo.wo_number,
              vehicleId: wo.vehicle?.id,
              licensePlate: wo.vehicle?.license_plate,
              itemType: 'SERVICE',
              itemName: woSvc.name || woSvc.service?.name || 'Dịch vụ',
              warrantyMonths: svcMonths,
              serviceDate: formatDateOnly(baseDate),
              expiresAt: expiresAt ? expiresAt.slice(0, 10) : null,
              mileageAtService: baseMileage,
              status: 'ACTIVE',
            });
          }
        }

        const isPackageService = woSvc.pricing_type === 'FIXED' || woSvc.pricing_type === 'VEHICLE_SIZE';
        if (isPackageService) {
          continue;
        }

        for (const job of woSvc.jobs || []) {
          for (const part of job.parts || []) {
            if (part.status === 'RETURNED') {
              continue;
            }
            const pMonths = Number(
              (part.warranty_months ?? 0) > 0 ? part.warranty_months : part.item?.warranty_months || 0
            );
            if (!isAlreadyClaimed && pMonths > 0) {
              const expiresAt = addMonthsIso(baseDate, pMonths);
              if (!expiresAt || new Date(expiresAt) >= now) {
                warrantyRecords.push({
                  workOrderId: wo.id,
                  woNumber: wo.wo_number,
                  vehicleId: wo.vehicle?.id,
                  licensePlate: wo.vehicle?.license_plate,
                  itemType: 'PART',
                  itemName: part.item?.part_category?.name || 'Phụ tùng chính hãng',
                  warrantyMonths: pMonths,
                  serviceDate: formatDateOnly(baseDate),
                  expiresAt: expiresAt ? expiresAt.slice(0, 10) : null,
                  mileageAtService: baseMileage,
                  status: 'ACTIVE',
                });
              }
            }
          }
        }
      }

      return {
        id: wo.id,
        woNumber: wo.wo_number,
        status: wo.status,
        completedAt: formatDateOnly(baseDate),
        mileageAtService: baseMileage,
        vehicle: {
          id: wo.vehicle?.id,
          licensePlate: wo.vehicle?.license_plate,
          make: wo.vehicle?.make,
          model: wo.vehicle?.model,
        },
        serviceNames: (wo.services || []).map((s: any) => s.name || s.service?.name).filter(Boolean),
        invoices: (wo.invoices || []).map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoice_number,
          status: inv.status,
          totalAmount: Number(inv.total_amount || 0),
          amountDue: Number(inv.amount_due || 0),
        })),
      };
    });

    return {
      customer: {
        id: customer.id,
        fullName: customer.full_name,
        phone: customer.phone ?? null,
        email: customer.email,
      },
      vehicles,
      upcomingAppointments,
      activeWorkOrders,
      recentCompletedOrders: recentCompletedOrders.slice(0, 3),
      warrantyRecords,
    };
  }
}
