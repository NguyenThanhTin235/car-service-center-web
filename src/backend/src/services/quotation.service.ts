import prisma from '../utils/prisma';
import { QuotationStatus, QuotationType, LineType } from '@prisma/client';
import { calculatePricingTotals, PricingLineItemInput } from '../utils/pricing-calculator.util';
import { notificationService } from './notification.service';

export interface CreateQuotationDto {
  discountAmount?: number;
  discountPercent?: number;
  quotationType?: 'PRIMARY' | 'SUPPLEMENTARY';
  parentQuotationId?: number;
}

export interface UpdateQuotationDto {
  discountAmount?: number;
  discountPercent?: number;
  lines?: Array<{
    id?: number;
    lineType: LineType;
    description: string;
    quantity: number;
    unitPrice: number;
    woServiceId?: number;
    jobId?: number;
    jobLabourId?: number;
    jobPartId?: number;
    sortOrder?: number;
  }>;
}

export class QuotationService {
  /**
   * Lấy danh sách toàn bộ báo giá của một Phiếu công việc (Work Order)
   */
  async getQuotationsByWorkOrder(workOrderId: number) {
    const quotations = await prisma.quotation.findMany({
      where: { work_order_id: workOrderId },
      include: {
        created_by: {
          select: { id: true, full_name: true, phone: true },
        },
        approved_by: {
          select: { id: true, full_name: true },
        },
        lines: {
          orderBy: { sort_order: 'asc' },
          include: {
            wo_service: { select: { id: true, name: true, pricing_type: true } },
            job: { select: { id: true, name: true } },
            job_labour: { select: { id: true, description: true } },
            job_part: {
              select: {
                id: true,
                status: true,
                item: {
                  select: {
                    id: true,
                    sku: true,
                    part_category: { select: { name: true } },
                    brand: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Xác định báo giá gửi cuối cùng cho khách hàng (Báo giá chính)
    const sentQuotations = quotations.filter(
      (q) => q.sent_at || ['SENT', 'APPROVED', 'REJECTED'].includes(q.status)
    );
    sentQuotations.sort((a, b) => {
      const timeA = a.sent_at ? new Date(a.sent_at).getTime() : new Date(a.created_at).getTime();
      const timeB = b.sent_at ? new Date(b.sent_at).getTime() : new Date(b.created_at).getTime();
      return timeB - timeA;
    });

    const latestSentId = sentQuotations.length > 0 ? sentQuotations[0].id : null;

    return quotations.map((q) => ({
      ...this.formatQuotation(q),
      isLatestSent: q.id === latestSentId,
      isDraft: q.status === 'DRAFT',
    }));
  }

  /**
   * Lấy chi tiết một Báo giá kèm kiểm tra phân quyền (Customer chỉ được xem xe của mình)
   */
  async getQuotationById(id: number, userRole: string, userId: number) {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        work_order: {
          include: {
            vehicle: true,
            customer: {
              select: { id: true, full_name: true, phone: true, email: true },
            },
            advisor: {
              select: { id: true, full_name: true, phone: true },
            },
          },
        },
        created_by: {
          select: { id: true, full_name: true, phone: true },
        },
        approved_by: {
          select: { id: true, full_name: true },
        },
        lines: {
          orderBy: { sort_order: 'asc' },
          include: {
            wo_service: { select: { id: true, name: true, pricing_type: true } },
            job: { select: { id: true, name: true } },
            job_labour: { select: { id: true, description: true } },
            job_part: {
              select: {
                id: true,
                status: true,
                item: {
                  select: {
                    id: true,
                    sku: true,
                    part_category: { select: { name: true } },
                    brand: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!quotation) {
      const err: any = new Error('Không tìm thấy báo giá');
      err.statusCode = 404;
      throw err;
    }

    if (userRole === 'CUSTOMER' && quotation.work_order.customer_id !== userId) {
      const err: any = new Error('Bạn không có quyền xem báo giá này');
      err.statusCode = 403;
      throw err;
    }

    return this.formatQuotationDetail(quotation);
  }

  /**
   * Tự động tạo Báo giá từ kế hoạch hiện tại của Phiếu công việc (UC-37)
   */
  async createQuotation(workOrderId: number, advisorUserId: number, dto: CreateQuotationDto = {}) {
    return await prisma.$transaction(async (tx) => {
      // 1. Kiểm tra Work Order hợp lệ
      const wo = await tx.workOrder.findUnique({
        where: { id: workOrderId },
        include: {
          vehicle: true,
          customer: true,
          services: {
            include: {
              service: {
                include: {
                  size_prices: true,
                },
              },
              jobs: {
                include: {
                  labours: true,
                  parts: {
                    include: {
                      item: {
                        include: {
                          part_category: true,
                          brand: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!wo) {
        throw new Error('Không tìm thấy phiếu công việc');
      }

      const closedStatuses = ['CLOSED', 'CANCELLED', 'RELEASED'];
      if (closedStatuses.includes(wo.status)) {
        throw new Error(`Phiếu công việc đã ở trạng thái ${wo.status}, không thể tạo báo giá mới`);
      }

      // 2. Bóc tách toàn bộ chi phí theo 3 mô hình tính giá
      const lineInputs: PricingLineItemInput[] = [];
      let sortIndex = 0;

      for (const woService of wo.services) {
        // Mô hình 1: Gói cố định (FIXED)
        if (woService.pricing_type === 'FIXED') {
          const packagePrice = Number(woService.service?.fixed_price || 0);
          lineInputs.push({
            lineType: 'PACKAGE',
            description: woService.name,
            quantity: 1,
            unitPrice: packagePrice,
            woServiceId: woService.id,
            sortOrder: sortIndex++,
          });
        }
        // Mô hình 2: Theo kích cỡ xe (VEHICLE_SIZE)
        else if (woService.pricing_type === 'VEHICLE_SIZE') {
          const vehicleSize = wo.vehicle.vehicle_size;
          const sizePriceObj = woService.service?.size_prices?.find(
            (sp) => sp.vehicle_size === vehicleSize
          );
          const sizePrice = Number(sizePriceObj?.price || 0);

          const sizeLabelsVi: Record<string, string> = {
            SMALL: 'Cỡ nhỏ',
            MEDIUM: 'Cỡ vừa',
            LARGE: 'Cỡ lớn',
            SUV: 'SUV / Crossover',
            TRUCK: 'Bán tải',
          };
          const sizeTextVi = sizeLabelsVi[vehicleSize] || vehicleSize;

          lineInputs.push({
            lineType: 'PACKAGE',
            description: `${woService.name} (Phân khúc xe: ${sizeTextVi})`,
            quantity: 1,
            unitPrice: sizePrice,
            woServiceId: woService.id,
            sortOrder: sortIndex++,
          });
        }
        // Mô hình 3: Nhân công & Phụ tùng thực tế (LABOUR_PARTS)
        else {
          for (const job of woService.jobs) {
            // Tiền nhân công (Fixed price theo JobLabour)
            for (const labour of job.labours) {
              lineInputs.push({
                lineType: 'LABOUR',
                description: labour.description || `Tiền công: ${job.name}`,
                quantity: 1,
                unitPrice: Number(labour.price),
                woServiceId: woService.id,
                jobId: job.id,
                jobLabourId: labour.id,
                sortOrder: sortIndex++,
              });
            }

            // Tiền phụ tùng (Số lượng x Giá bán)
            for (const part of job.parts) {
              const partName =
                part.item.part_category.name +
                (part.item.brand ? ` (${part.item.brand.name})` : ` - ${part.item.sku}`);

              lineInputs.push({
                lineType: 'PART',
                description: partName,
                quantity: Number(part.planned_quantity),
                unitPrice: Number(part.unit_price),
                woServiceId: woService.id,
                jobId: job.id,
                jobPartId: part.id,
                sortOrder: sortIndex++,
              });
            }
          }
        }
      }

      if (lineInputs.length === 0) {
        throw new Error('Phiếu công việc chưa có bất kỳ hạng mục dịch vụ hoặc phụ tùng nào có chi phí.');
      }

      // 3. Tính toán chi phí, chiết khấu và tổng thanh toán theo chuẩn Zero-Tax
      const totals = calculatePricingTotals({
        lines: lineInputs,
        discountAmount: dto.discountAmount,
        discountPercent: dto.discountPercent,
      });

      // 4. Kiểm tra trùng lặp: Nếu nội dung các dòng và tổng tiền giống hệt một báo giá cũ thì không tạo mới
      const existingQuotations = await tx.quotation.findMany({
        where: { work_order_id: workOrderId },
        include: {
          created_by: {
            select: { id: true, full_name: true, phone: true },
          },
          approved_by: {
            select: { id: true, full_name: true },
          },
          lines: {
            orderBy: { sort_order: 'asc' },
            include: {
              wo_service: { select: { id: true, name: true, pricing_type: true } },
              job: { select: { id: true, name: true } },
              job_labour: { select: { id: true, description: true } },
              job_part: {
                select: {
                  id: true,
                  status: true,
                  item: {
                    select: {
                      id: true,
                      sku: true,
                      part_category: { select: { name: true } },
                      brand: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { id: 'desc' },
      });

      const getLineSignature = (l: {
        lineType?: string; line_type?: string;
        woServiceId?: number | null; wo_service_id?: number | null;
        jobId?: number | null; job_id?: number | null;
        jobLabourId?: number | null; job_labour_id?: number | null;
        jobPartId?: number | null; job_part_id?: number | null;
        quantity: number | any;
        unitPrice?: number | any; snapshot_unit_price?: number | any;
      }) => {
        const type = l.lineType || l.line_type || '';
        const sId = l.woServiceId ?? l.wo_service_id ?? 0;
        const jId = l.jobId ?? l.job_id ?? 0;
        const lId = l.jobLabourId ?? l.job_labour_id ?? 0;
        const pId = l.jobPartId ?? l.job_part_id ?? 0;
        const qty = Number(l.quantity || 0).toFixed(2);
        const price = Number(l.unitPrice ?? l.snapshot_unit_price ?? 0).toFixed(2);
        return `${type}|${sId}|${jId}|${lId}|${pId}|${qty}|${price}`;
      };

      const currentSignatures = totals.lines.map(getLineSignature).sort().join(';;');

      for (const eq of existingQuotations) {
        const eqGrandTotal = Number(eq.grand_total);
        const eqSubtotal = Number(eq.subtotal);
        const eqDiscount = Number(eq.discount_amount);

        if (
          Math.abs(eqGrandTotal - totals.grandTotal) < 0.01 &&
          Math.abs(eqSubtotal - totals.subtotal) < 0.01 &&
          Math.abs(eqDiscount - totals.discountAmount) < 0.01 &&
          eq.lines.length === totals.lines.length
        ) {
          const eqSignatures = eq.lines.map(getLineSignature).sort().join(';;');
          if (eqSignatures === currentSignatures) {
            // Trùng khớp hoàn toàn với một báo giá cũ -> Thông báo và hiển thị lại báo giá cũ, không tạo mới
            const formatted = this.formatQuotation(eq);
            return {
              ...formatted,
              isDuplicate: true,
              duplicateMessage: `Kế hoạch dịch vụ và phụ tùng không có thay đổi so với báo giá ${eq.quotation_number}. Hệ thống tự động mở lại báo giá này thay vì tạo mới.`,
            };
          }
        }
      }

      // 5. Sinh mã báo giá duy nhất nếu có thay đổi
      const existingCount = existingQuotations.length;
      const quotationNumber = `QUO-${wo.wo_number}-${String(existingCount + 1).padStart(2, '0')}`;

      const quotationType: QuotationType =
        dto.quotationType || (existingCount === 0 ? 'PRIMARY' : 'SUPPLEMENTARY');

      // 6. Lưu vào Database
      const quotation = await tx.quotation.create({
        data: {
          work_order_id: workOrderId,
          quotation_number: quotationNumber,
          quotation_type: quotationType,
          parent_quotation_id: dto.parentQuotationId || null,
          status: 'DRAFT',
          subtotal: totals.subtotal,
          discount_amount: totals.discountAmount,
          tax_rate: 0,
          tax_amount: 0,
          grand_total: totals.grandTotal,
          created_by_id: advisorUserId,
          lines: {
            create: totals.lines.map((l) => ({
              line_type: l.lineType,
              description: l.description,
              quantity: l.quantity,
              snapshot_unit_price: l.unitPrice,
              amount: l.amount,
              sort_order: l.sortOrder ?? 0,
              wo_service_id: l.woServiceId || null,
              job_id: l.jobId || null,
              job_labour_id: l.jobLabourId || null,
              job_part_id: l.jobPartId || null,
            })),
          },
        },
        include: {
          lines: true,
        },
      });

      return this.formatQuotation(quotation);
    });
  }

  /**
   * Cập nhật chiết khấu hoặc chi tiết báo giá khi còn ở trạng thái DRAFT / SENT (UC-39)
   */
  async updateQuotation(id: number, advisorUserId: number, dto: UpdateQuotationDto) {
    return await prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.findUnique({
        where: { id },
        include: { lines: true },
      });

      if (!quotation) {
        throw new Error('Không tìm thấy báo giá');
      }

      if (quotation.status === 'APPROVED') {
        throw new Error('Báo giá đã được phê duyệt, không thể chỉnh sửa.');
      }

      let currentLines: PricingLineItemInput[] = [];

      // Nếu client gửi lại danh sách lines điều chỉnh
      if (dto.lines && dto.lines.length > 0) {
        currentLines = dto.lines.map((l, idx) => ({
          id: l.id,
          lineType: l.lineType,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          woServiceId: l.woServiceId,
          jobId: l.jobId,
          jobLabourId: l.jobLabourId,
          jobPartId: l.jobPartId,
          sortOrder: l.sortOrder !== undefined ? l.sortOrder : idx,
        }));
      } else {
        // Tái sử dụng các dòng hiện tại
        currentLines = quotation.lines.map((l) => ({
          id: l.id,
          lineType: l.line_type,
          description: l.description,
          quantity: Number(l.quantity),
          unitPrice: Number(l.snapshot_unit_price),
          woServiceId: l.wo_service_id || undefined,
          jobId: l.job_id || undefined,
          jobLabourId: l.job_labour_id || undefined,
          jobPartId: l.job_part_id || undefined,
          sortOrder: l.sort_order,
        }));
      }

      // Tính lại tổng
      const totals = calculatePricingTotals({
        lines: currentLines,
        discountAmount: dto.discountAmount,
        discountPercent: dto.discountPercent,
      });

      // Nếu có cập nhật lines, đồng bộ lại bảng lines
      if (dto.lines && dto.lines.length > 0) {
        await tx.quotationLine.deleteMany({ where: { quotation_id: id } });
        await tx.quotationLine.createMany({
          data: totals.lines.map((l) => ({
            quotation_id: id,
            line_type: l.lineType,
            description: l.description,
            quantity: l.quantity,
            snapshot_unit_price: l.unitPrice,
            amount: l.amount,
            sort_order: l.sortOrder ?? 0,
            wo_service_id: l.woServiceId || null,
            job_id: l.jobId || null,
            job_labour_id: l.jobLabourId || null,
            job_part_id: l.jobPartId || null,
          })),
        });
      }

      const updated = await tx.quotation.update({
        where: { id },
        data: {
          subtotal: totals.subtotal,
          discount_amount: totals.discountAmount,
          tax_rate: 0,
          tax_amount: 0,
          grand_total: totals.grandTotal,
        },
        include: { lines: true },
      });

      return this.formatQuotation(updated);
    });
  }

  /**
   * Gửi báo giá cho khách hàng -> chuyển WorkOrder sang PENDING_APPROVAL
   */
  async sendQuotation(id: number, advisorUserId: number) {
    return await prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.findUnique({
        where: { id },
        include: {
          work_order: {
            include: { customer: true, vehicle: true },
          },
        },
      });

      if (!quotation) throw new Error('Không tìm thấy báo giá');

      if (quotation.status === 'APPROVED') {
        throw new Error('Báo giá này đã được duyệt trước đó');
      }

      // Cập nhật trạng thái Quotation sang SENT
      const updated = await tx.quotation.update({
        where: { id },
        data: {
          status: 'SENT',
          sent_at: new Date(),
        },
      });

      // Chuyển Work Order sang PENDING_APPROVAL
      await tx.workOrder.update({
        where: { id: quotation.work_order_id },
        data: {
          status: 'PENDING_APPROVAL',
        },
      });

      // Gửi email thông báo cho khách hàng nếu có email kèm Deep Link
      const customerEmail = quotation.work_order.customer?.email;
      if (customerEmail) {
        const grandTotalFormatted = Number(updated.grand_total).toLocaleString('vi-VN');
        const trackingLink = `http://localhost:3000/tracking`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #1e40af; padding: 24px; text-align: center; color: #ffffff;">
              <h2 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">CAR SERVICE CENTER</h2>
              <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Bảng Báo Giá Dịch Vụ Sửa Chữa & Bảo Dưỡng Ô Tô</p>
            </div>
            <div style="padding: 24px; background: #ffffff;">
              <p>Kính gửi Quý khách <b>${quotation.work_order.customer?.full_name || 'Khách hàng'}</b>,</p>
              <p>Cố vấn dịch vụ đã hoàn tất lập dự toán kỹ thuật và kính gửi Quý khách Bảng báo giá chi tiết cho xe <b>${quotation.work_order.vehicle.license_plate}</b> (${quotation.work_order.vehicle.make} ${quotation.work_order.vehicle.model}).</p>
              
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #64748b; font-size: 13px; padding: 5px 0; text-align: left; vertical-align: middle;">Số báo giá:</td>
                    <td style="font-weight: bold; color: #0f172a; font-size: 13px; padding: 5px 0; text-align: right; vertical-align: middle; font-family: monospace, sans-serif;">${updated.quotation_number}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; font-size: 13px; padding: 5px 0; text-align: left; vertical-align: middle;">Chính sách thuế:</td>
                    <td style="font-weight: 600; color: #15803d; font-size: 13px; padding: 5px 0; text-align: right; vertical-align: middle;">0% VAT (Không thu thuế)</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding-top: 10px; border-bottom: 1px dashed #cbd5e1;"></td>
                  </tr>
                  <tr>
                    <td style="color: #1e40af; font-size: 14px; font-weight: bold; padding: 12px 0 2px 0; text-align: left; vertical-align: middle;">TỔNG THANH TOÁN:</td>
                    <td style="font-size: 20px; font-weight: bold; color: #1e40af; padding: 12px 0 2px 0; text-align: right; vertical-align: middle;">${grandTotalFormatted} đ</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 28px 0;">
                <a href="${trackingLink}" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 14px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  👉 Xem Chi Tiết & Phê Duyệt Báo Giá
                </a>
              </div>

              <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 20px;">
                * Báo giá có hiệu lực trong vòng 07 ngày kể từ ngày lập. Quý khách vui lòng kiểm tra và phê duyệt để xưởng tiến hành thi công.
              </p>
            </div>
            <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
              Hotline hỗ trợ: 1900 6868 | Email: cskh@carservice.vn<br/>
              Hệ thống Dịch vụ & Chăm sóc Kỹ thuật Ô tô Toàn diện
            </div>
          </div>
        `;

        notificationService
          .sendEmail(
            customerEmail,
            `[Car Service Center] Báo giá dịch vụ cho xe ${quotation.work_order.vehicle.license_plate}`,
            emailHtml
          )
          .catch((err: any) => console.warn('[Quotation Email Error]', err?.message));
      }

      return this.formatQuotation(updated);
    });
  }

  /**
   * Phê duyệt báo giá (Customer duyệt hoặc Advisor xác nhận thay) (UC-39)
   * Kích hoạt: Quotation -> APPROVED, WorkOrder -> APPROVED, JobPart -> RESERVED
   */
  async approveQuotation(id: number, approverUserId: number, approverRole: string) {
    return await prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.findUnique({
        where: { id },
        include: {
          work_order: true,
          lines: true,
        },
      });

      if (!quotation) throw new Error('Không tìm thấy báo giá');

      if (quotation.status === 'APPROVED') {
        throw new Error('Báo giá này đã được phê duyệt trước đó');
      }

      // Security check nếu là Customer
      if (approverRole === 'CUSTOMER' && quotation.work_order.customer_id !== approverUserId) {
        throw new Error('Bạn không có quyền duyệt báo giá này');
      }

      const now = new Date();

      // 1. Chuyển Quotation sang APPROVED và đóng băng snapshot
      const updatedQuotation = await tx.quotation.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approved_at: now,
          approved_by_id: approverUserId,
          snapshot_at: now,
        },
      });

      // 2. Chuyển trạng thái toàn bộ JobPart trong báo giá sang RESERVED (Giữ kho)
      const partIds = quotation.lines
        .map((l) => l.job_part_id)
        .filter((partId): partId is number => partId !== null && partId !== undefined);

      if (partIds.length > 0) {
        await tx.jobPart.updateMany({
          where: { id: { in: partIds } },
          data: { status: 'RESERVED' },
        });
      }

      // 3. Chuyển Work Order sang APPROVED (cho phép bắt đầu xuất kho & thi công)
      await tx.workOrder.update({
        where: { id: quotation.work_order_id },
        data: {
          status: 'APPROVED',
        },
      });

      // 4. Khóa và xác nhận thông tin tiếp nhận xe (check-in) khi khách hàng phê duyệt báo giá
      if (quotation.work_order_id) {
        await tx.checkIn.updateMany({
          where: { work_order_id: quotation.work_order_id },
          data: {
            status: 'CONFIRMED',
            confirmed_at: now,
            confirmed_by_customer_id: approverRole === 'CUSTOMER' ? approverUserId : undefined,
          },
        });
      }

      return this.formatQuotation(updatedQuotation);
    });
  }

  /**
   * Từ chối báo giá kèm lý do (Customer từ chối hoặc Advisor ghi nhận) (UC-39)
   * Kích hoạt: Quotation -> REJECTED, WorkOrder -> quay về IN_PLANNING
   */
  async rejectQuotation(id: number, reason: string, rejecterUserId: number, rejecterRole: string) {
    return await prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.findUnique({
        where: { id },
        include: { work_order: true },
      });

      if (!quotation) throw new Error('Không tìm thấy báo giá');

      if (quotation.status === 'APPROVED') {
        throw new Error('Báo giá đã được duyệt, không thể từ chối.');
      }

      if (rejecterRole === 'CUSTOMER' && quotation.work_order.customer_id !== rejecterUserId) {
        throw new Error('Bạn không có quyền từ chối báo giá này');
      }

      // 1. Chuyển Quotation sang REJECTED
      const updatedQuotation = await tx.quotation.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejected_at: new Date(),
          reject_reason: reason || 'Khách hàng không đồng ý với chi phí đề xuất.',
        },
      });

      // 2. Chuyển Work Order quay lại IN_PLANNING để Cố vấn điều chỉnh dịch vụ/job
      await tx.workOrder.update({
        where: { id: quotation.work_order_id },
        data: {
          status: 'IN_PLANNING',
        },
      });

      return this.formatQuotation(updatedQuotation);
    });
  }

  /**
   * Hủy báo giá nháp (UC-40)
   */
  async cancelQuotation(id: number, advisorUserId: number) {
    return await prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.findUnique({
        where: { id },
      });

      if (!quotation) throw new Error('Không tìm thấy báo giá');

      if (quotation.status === 'APPROVED') {
        throw new Error('Không thể hủy báo giá đã được phê duyệt.');
      }

      // Xóa các dòng báo giá và bản ghi báo giá nháp
      await tx.quotationLine.deleteMany({ where: { quotation_id: id } });
      await tx.quotation.delete({ where: { id } });

      return { success: true, message: 'Đã hủy báo giá thành công' };
    });
  }

  private formatQuotation(q: any) {
    return {
      id: q.id,
      workOrderId: q.work_order_id,
      quotationNumber: q.quotation_number,
      quotationType: q.quotation_type,
      parentQuotationId: q.parent_quotation_id,
      status: q.status,
      subtotal: Number(q.subtotal),
      discountAmount: Number(q.discount_amount),
      taxRate: 0,
      taxAmount: 0,
      grandTotal: Number(q.grand_total),
      sentAt: q.sent_at,
      approvedAt: q.approved_at,
      approvedBy: q.approved_by,
      rejectedAt: q.rejected_at,
      rejectReason: q.reject_reason,
      snapshotAt: q.snapshot_at,
      createdBy: q.created_by,
      createdAt: q.created_at,
      updatedAt: q.updated_at,
      lines: (q.lines || []).map((l: any) => ({
        id: l.id,
        lineType: l.line_type,
        description: l.description,
        quantity: Number(l.quantity),
        snapshotUnitPrice: Number(l.snapshot_unit_price),
        amount: Number(l.amount),
        sortOrder: l.sort_order,
        woServiceId: l.wo_service_id,
        woServiceName: l.wo_service?.name,
        jobId: l.job_id,
        jobName: l.job?.name,
        jobLabourId: l.job_labour_id,
        jobPartId: l.job_part_id,
        partItem: l.job_part?.item
          ? {
              id: l.job_part.item.id,
              sku: l.job_part.item.sku,
              name:
                l.job_part.item.part_category?.name +
                (l.job_part.item.brand ? ` (${l.job_part.item.brand.name})` : ''),
            }
          : null,
      })),
    };
  }

  private formatQuotationDetail(q: any) {
    const base = this.formatQuotation(q);
    return {
      ...base,
      workOrder: {
        id: q.work_order.id,
        woNumber: q.work_order.wo_number,
        status: q.work_order.status,
        customer: q.work_order.customer,
        vehicle: q.work_order.vehicle,
        advisor: q.work_order.advisor,
      },
    };
  }
}

export const quotationService = new QuotationService();
