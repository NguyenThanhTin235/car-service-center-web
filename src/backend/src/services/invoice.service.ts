import prisma from '../utils/prisma';
import { InvoiceStatus, Prisma, LineType, AuditAction } from '@prisma/client';
import { buildInvoiceLinesFromQuotations } from '../utils/invoice-builder.util';
import { calculatePricingTotals, PricingLineItemInput } from '../utils/pricing-calculator.util';
import { notificationService } from './notification.service';
import { buildInvoiceIssuedEmail } from '../utils/invoice-email.templates';
import { generateInvoicePdfBuffer } from '../utils/pdf-invoice.util';

export class InvoiceService {
  /**
   * Sinh mã số hóa đơn tự tăng theo định dạng: INV-YYYYMM-NNN
   */
  async generateInvoiceNumber(tx?: any): Promise<string> {
    const client = tx || prisma;
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `INV-${yearMonth}-`;

    const latest = await client.invoice.findFirst({
      where: { invoice_number: { startsWith: prefix } },
      orderBy: { invoice_number: 'desc' },
      select: { invoice_number: true },
    });

    let nextSeq = 1;
    if (latest && latest.invoice_number) {
      const parts = latest.invoice_number.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    return `${prefix}${String(nextSeq).padStart(3, '0')}`;
  }

  /**
   * Kiểm tra nghiêm ngặt điều kiện xuất hóa đơn của Work Order (BR-27-01, BR-27-02)
   */
  async assertBillableWorkOrder(workOrderId: number, tx?: any) {
    const client = tx || prisma;
    const wo = await client.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        customer: true,
        vehicle: true,
        advisor: true,
        services: {
          include: {
            jobs: {
              include: {
                parts: true,
              },
            },
            qc_records: { orderBy: { created_at: 'desc' }, take: 1 },
          },
        },
        quotations: {
          where: { status: 'APPROVED' },
          include: {
            lines: {
              include: {
                job_part: true,
                wo_service: true,
                job: true,
              },
              orderBy: { sort_order: 'asc' },
            },
          },
          orderBy: [{ approved_at: 'desc' }, { created_at: 'desc' }, { id: 'desc' }],
        },
        invoices: {
          where: { status: { in: ['DRAFT', 'ISSUED', 'PAID'] } },
        },
      },
    });

    if (!wo) {
      const err: any = new Error('Không tìm thấy phiếu công việc');
      err.statusCode = 404;
      throw err;
    }

    // 1. Kiểm tra trạng thái WO phải là BILLING_REQUESTED
    if (wo.status !== 'BILLING_REQUESTED') {
      const err: any = new Error(
        `Phiếu công việc đang ở trạng thái ${wo.status}, chỉ có thể tạo hóa đơn khi ở trạng thái Chờ thanh toán (BILLING_REQUESTED).`
      );
      err.statusCode = 422;
      throw err;
    }

    // 2. Kiểm tra chưa có hóa đơn active nào (DRAFT, ISSUED, PAID)
    if (wo.invoices && wo.invoices.length > 0) {
      const activeInv = wo.invoices[0];
      const statusLabel =
        activeInv.status === 'PAID'
          ? 'đã thanh toán'
          : activeInv.status === 'ISSUED'
          ? 'đã phát hành'
          : 'bản nháp';
      const err: any = new Error(
        `Phiếu công việc đã có hóa đơn ${statusLabel} (Mã: ${activeInv.invoice_number}).`
      );
      err.statusCode = 422;
      throw err;
    }

    // 3. Phải có ít nhất 1 báo giá APPROVED
    if (!wo.quotations || wo.quotations.length === 0) {
      const err: any = new Error('Phiếu công việc chưa có báo giá nào được khách hàng phê duyệt.');
      err.statusCode = 422;
      throw err;
    }

    // 4. Kiểm tra 100% dịch vụ đã QC PASS
    const unpassedServices = (wo.services || []).filter(
      (s: any) => !s.qc_records.length || s.qc_records[0].overall_result !== 'PASS'
    );
    if (unpassedServices.length > 0) {
      const names = unpassedServices.map((s: any) => s.name).join(', ');
      const err: any = new Error(
        `Không thể tạo hóa đơn: Các dịch vụ sau chưa đạt nghiệm thu chất lượng (QC): ${names}`
      );
      err.statusCode = 422;
      throw err;
    }

    // 5. Kiểm tra không còn Job nào REWORK hoặc PLANNED/IN_PROGRESS
    const incompleteJobs = (wo.services || [])
      .flatMap((s: any) => s.jobs || [])
      .filter((j: any) => j.status === 'REWORK' || j.status === 'PLANNED' || j.status === 'IN_PROGRESS');

    if (incompleteJobs.length > 0) {
      const err: any = new Error(
        `Không thể tạo hóa đơn: Còn ${incompleteJobs.length} hạng mục công việc chưa hoàn thành hoặc đang trong vòng lặp làm lại (Rework).`
      );
      err.statusCode = 422;
      throw err;
    }

    return wo;
  }

  /**
   * Hàng chờ lập hóa đơn và quản lý hóa đơn dành cho Nhân viên quầy (Desk Staff / Cashier)
   */
  async getBillingQueue(
    filters: {
      tab?: 'PENDING' | 'DRAFT' | 'ISSUED' | 'PAID' | 'ALL';
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { tab = 'PENDING', search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    // Tính toán counters cho các tab
    const [pendingCount, draftCount, issuedCount, paidInvoicesToday] = await Promise.all([
      // PENDING: Work Orders đang BILLING_REQUESTED và chưa có hóa đơn active
      prisma.workOrder.count({
        where: {
          status: 'BILLING_REQUESTED',
          invoices: {
            none: {
              status: { in: ['DRAFT', 'ISSUED', 'PAID'] },
            },
          },
        },
      }),
      // DRAFT
      prisma.invoice.count({ where: { status: 'DRAFT' } }),
      // ISSUED
      prisma.invoice.count({ where: { status: 'ISSUED' } }),
      // PAID hôm nay
      prisma.invoice.findMany({
        where: {
          status: 'PAID',
          paid_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        select: { total_amount: true },
      }),
    ]);

    const paidTodayCount = paidInvoicesToday.length;
    const paidTodayRevenue = paidInvoicesToday.reduce(
      (sum, inv) => sum + Number(inv.total_amount || 0),
      0
    );

    const summary = {
      pendingCount,
      draftCount,
      issuedCount,
      paidTodayCount,
      paidTodayRevenue,
    };

    // Truy vấn dữ liệu theo Tab
    if (tab === 'PENDING') {
      const whereWO: Prisma.WorkOrderWhereInput = {
        status: 'BILLING_REQUESTED',
        invoices: {
          none: {
            status: { in: ['DRAFT', 'ISSUED', 'PAID'] },
          },
        },
      };

      if (search) {
        whereWO.OR = [
          { wo_number: { contains: search } },
          { vehicle: { license_plate: { contains: search } } },
          { customer: { full_name: { contains: search } } },
          { customer: { phone: { contains: search } } },
        ];
      }

      const [total, records] = await Promise.all([
        prisma.workOrder.count({ where: whereWO }),
        prisma.workOrder.findMany({
          where: whereWO,
          skip,
          take: limit,
          include: {
            customer: { select: { id: true, full_name: true, phone: true, email: true } },
            vehicle: { select: { id: true, license_plate: true, make: true, model: true, year: true } },
            advisor: { select: { id: true, full_name: true, phone: true } },
            services: { select: { id: true, name: true, pricing_type: true } },
            quotations: {
              where: { status: 'APPROVED' },
              select: {
                id: true,
                quotation_number: true,
                quotation_type: true,
                grand_total: true,
                approved_at: true,
              },
              orderBy: [{ approved_at: 'desc' }, { created_at: 'desc' }, { id: 'desc' }],
            },
          },
          orderBy: { updated_at: 'desc' },
        }),
      ]);

      const formattedPending = records.map((wo) => {
        const latestQuote = wo.quotations[0];
        const totalEstimated = latestQuote ? Number(latestQuote.grand_total || 0) : 0;
        return {
          type: 'WORK_ORDER',
          id: wo.id,
          workOrderId: wo.id,
          woNumber: wo.wo_number,
          status: wo.status,
          customer: wo.customer,
          vehicle: wo.vehicle,
          advisor: wo.advisor,
          services: wo.services,
          quotations: latestQuote ? [latestQuote] : [],
          estimatedTotal: totalEstimated,
          updatedAt: wo.updated_at,
        };
      });

      return {
        tab,
        summary,
        records: formattedPending,
        pagination: {
          total,
          count: formattedPending.length,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          perPage: limit,
        },
      };
    }

    // Các tab hóa đơn: DRAFT, ISSUED, PAID, ALL
    const whereInv: Prisma.InvoiceWhereInput = {};
    if (tab !== 'ALL') {
      whereInv.status = tab as InvoiceStatus;
    }

    if (search) {
      whereInv.OR = [
        { invoice_number: { contains: search } },
        { work_order: { wo_number: { contains: search } } },
        { work_order: { vehicle: { license_plate: { contains: search } } } },
        { work_order: { customer: { full_name: { contains: search } } } },
        { work_order: { customer: { phone: { contains: search } } } },
      ];
    }

    const [total, records] = await Promise.all([
      prisma.invoice.count({ where: whereInv }),
      prisma.invoice.findMany({
        where: whereInv,
        skip,
        take: limit,
        include: {
          work_order: {
            include: {
              customer: { select: { id: true, full_name: true, phone: true, email: true } },
              vehicle: { select: { id: true, license_plate: true, make: true, model: true, year: true } },
              advisor: { select: { id: true, full_name: true, phone: true } },
            },
          },
          created_by: { select: { id: true, full_name: true } },
          issued_by: { select: { id: true, full_name: true } },
          payments: {
            orderBy: { created_at: 'desc' },
            take: 1,
            select: {
              id: true,
              payment_method: true,
              status: true,
              amount: true,
              paid_at: true,
            },
          },
        },
        orderBy: { updated_at: 'desc' },
      }),
    ]);

    const formattedInvoices = records.map((inv) => ({
      type: 'INVOICE',
      id: inv.id,
      workOrderId: inv.work_order_id,
      woNumber: inv.work_order.wo_number,
      invoiceNumber: inv.invoice_number,
      status: inv.status,
      subtotal: Number(inv.subtotal),
      discountAmount: Number(inv.discount_amount),
      discountReason: inv.discount_reason,
      taxAmount: Number(inv.tax_amount),
      totalAmount: Number(inv.total_amount),
      amountDue: Number(inv.amount_due),
      notes: inv.notes,
      issuedAt: inv.issued_at,
      paidAt: inv.paid_at,
      cancelledAt: inv.cancelled_at,
      createdAt: inv.created_at,
      customer: inv.work_order.customer,
      vehicle: inv.work_order.vehicle,
      advisor: inv.work_order.advisor,
      createdBy: inv.created_by,
      issuedBy: inv.issued_by,
      lastPayment: inv.payments?.[0] || null,
    }));

    return {
      tab,
      summary,
      records: formattedInvoices,
      pagination: {
        total,
        count: formattedInvoices.length,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit,
      },
    };
  }

  /**
   * Xem trước bảng tính hóa đơn từ Work Order trước khi bấm tạo nháp (UC-27 Preview)
   */
  async previewInvoice(workOrderId: number) {
    const wo = await this.assertBillableWorkOrder(workOrderId);

    // Tính toán các dòng và số tiền từ tất cả các báo giá APPROVED
    const calculation = buildInvoiceLinesFromQuotations(wo.quotations);

    return {
      workOrderId: wo.id,
      woNumber: wo.wo_number,
      customer: {
        id: wo.customer.id,
        fullName: wo.customer.full_name,
        phone: wo.customer.phone,
        email: wo.customer.email,
      },
      vehicle: {
        id: wo.vehicle.id,
        licensePlate: wo.vehicle.license_plate,
        make: wo.vehicle.make,
        model: wo.vehicle.model,
        year: wo.vehicle.year,
      },
      advisor: {
        id: wo.advisor.id,
        fullName: wo.advisor.full_name,
        phone: wo.advisor.phone,
      },
      sourceQuotationNumbers: calculation.sourceQuotationNumbers,
      subtotal: calculation.subtotal,
      defaultDiscount: calculation.defaultDiscount,
      taxAmount: 0,
      totalAmount: calculation.totalAmount,
      amountDue: calculation.amountDue,
      reconciliationNotes: calculation.reconciliationNotes,
      lines: calculation.lines,
    };
  }

  /**
   * Tạo hóa đơn nháp (UC-27: Create Draft Invoice)
   */
  async createDraft(workOrderId: number, userId: number, notes?: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Kiểm tra điều kiện billable trong transaction
      const wo = await this.assertBillableWorkOrder(workOrderId, tx);

      // 2. Tính toán các dòng hóa đơn
      const calculation = buildInvoiceLinesFromQuotations(wo.quotations);

      // 3. Sinh số hóa đơn
      const invoiceNumber = await this.generateInvoiceNumber(tx);

      // 4. Tạo bản ghi hóa đơn và các dòng hóa đơn
      const invoice = await tx.invoice.create({
        data: {
          work_order_id: workOrderId,
          invoice_number: invoiceNumber,
          status: 'DRAFT',
          subtotal: calculation.subtotal,
          discount_amount: calculation.defaultDiscount,
          tax_amount: 0,
          total_amount: calculation.totalAmount,
          amount_due: calculation.amountDue,
          notes: notes?.trim() || null,
          created_by_id: userId,
          lines: {
            create: calculation.lines.map((l) => ({
              line_type: l.lineType,
              quotation_line_id: l.quotationLineId,
              wo_service_id: l.woServiceId,
              job_id: l.jobId,
              description: l.description,
              quantity: l.quantity,
              unit_price: l.unitPrice,
              amount: l.amount,
              sort_order: l.sortOrder,
            })),
          },
        },
        include: {
          lines: { orderBy: { sort_order: 'asc' } },
        },
      });

      // 5. Ghi Audit Log
      await tx.auditLog.create({
        data: {
          user_id: userId,
          action: AuditAction.CREATE,
          entity_type: 'INVOICE',
          entity_id: invoice.id,
          after_data: {
            invoiceNumber: invoice.invoice_number,
            status: invoice.status,
            totalAmount: Number(invoice.total_amount),
            notes: invoice.notes,
          },
        },
      });

      return {
        id: invoice.id,
        workOrderId: invoice.work_order_id,
        invoiceNumber: invoice.invoice_number,
        status: invoice.status,
        subtotal: Number(invoice.subtotal),
        discountAmount: Number(invoice.discount_amount),
        taxAmount: Number(invoice.tax_amount),
        totalAmount: Number(invoice.total_amount),
        amountDue: Number(invoice.amount_due),
        notes: invoice.notes,
        createdAt: invoice.created_at,
        lines: invoice.lines,
      };
    });
  }

  /**
   * Cập nhật chiết khấu hoặc ghi chú của Hóa đơn nháp (UC-27: Update Draft Discount)
   */
  async updateDraft(
    invoiceId: number,
    userId: number,
    data: {
      discountAmount?: number;
      discountPercent?: number;
      discountReason?: string;
      notes?: string;
    }
  ) {
    return await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { lines: true },
      });

      if (!invoice) {
        const err: any = new Error('Không tìm thấy hóa đơn');
        err.statusCode = 404;
        throw err;
      }

      if (invoice.status !== 'DRAFT') {
        const err: any = new Error(
          `Hóa đơn đang ở trạng thái ${invoice.status}. Chỉ có thể chỉnh sửa chiết khấu khi ở trạng thái Nháp (DRAFT).`
        );
        err.statusCode = 422;
        throw err;
      }

      const beforeData = {
        discountAmount: Number(invoice.discount_amount),
        discountReason: invoice.discount_reason,
        totalAmount: Number(invoice.total_amount),
        notes: invoice.notes,
      };

      // Chuyển lines sang pricing input để tính toán lại
      const pricingLines: PricingLineItemInput[] = invoice.lines.map((l) => ({
        lineType: l.line_type,
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unit_price),
        sortOrder: l.sort_order,
      }));

      const newPricing = calculatePricingTotals({
        lines: pricingLines,
        discountAmount: data.discountAmount,
        discountPercent: data.discountPercent,
      });

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          subtotal: newPricing.subtotal,
          discount_amount: newPricing.discountAmount,
          discount_reason: data.discountReason?.trim() || invoice.discount_reason,
          tax_amount: 0,
          total_amount: newPricing.grandTotal,
          amount_due: newPricing.grandTotal,
          notes: data.notes !== undefined ? (data.notes ? data.notes.trim() : null) : invoice.notes,
        },
      });

      // Ghi Audit Log
      await tx.auditLog.create({
        data: {
          user_id: userId,
          action: AuditAction.UPDATE,
          entity_type: 'INVOICE',
          entity_id: invoiceId,
          before_data: beforeData,
          after_data: {
            discountAmount: Number(updatedInvoice.discount_amount),
            discountReason: updatedInvoice.discount_reason,
            totalAmount: Number(updatedInvoice.total_amount),
            notes: updatedInvoice.notes,
          },
        },
      });

      return {
        id: updatedInvoice.id,
        invoiceNumber: updatedInvoice.invoice_number,
        status: updatedInvoice.status,
        subtotal: Number(updatedInvoice.subtotal),
        discountAmount: Number(updatedInvoice.discount_amount),
        discountReason: updatedInvoice.discount_reason,
        taxAmount: Number(updatedInvoice.tax_amount),
        totalAmount: Number(updatedInvoice.total_amount),
        amountDue: Number(updatedInvoice.amount_due),
        notes: updatedInvoice.notes,
        updatedAt: updatedInvoice.updated_at,
      };
    });
  }

  /**
   * Phát hành hóa đơn chính thức cho khách hàng (UC-27: Issue Invoice)
   */
  async issueInvoice(invoiceId: number, userId: number) {
    return await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          work_order: {
            include: {
              customer: true,
              vehicle: true,
              advisor: true,
            },
          },
        },
      });

      if (!invoice) {
        const err: any = new Error('Không tìm thấy hóa đơn');
        err.statusCode = 404;
        throw err;
      }

      if (invoice.status !== 'DRAFT') {
        const err: any = new Error(
          `Hóa đơn đang ở trạng thái ${invoice.status}. Chỉ có thể phát hành khi đang ở trạng thái Nháp (DRAFT).`
        );
        err.statusCode = 422;
        throw err;
      }

      const issuedAt = new Date();
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'ISSUED',
          issued_at: issuedAt,
          issued_by_id: userId,
          amount_due: invoice.total_amount, // Ghi nhận công nợ
        },
      });

      // Ghi Audit Log
      await tx.auditLog.create({
        data: {
          user_id: userId,
          action: AuditAction.STATUS_CHANGE,
          entity_type: 'INVOICE',
          entity_id: invoiceId,
          before_data: { status: 'DRAFT' },
          after_data: { status: 'ISSUED', issuedAt, issuedById: userId },
        },
      });

      // Tạo thông báo cho Khách hàng
      await tx.notification.create({
        data: {
          user_id: invoice.work_order.customer_id,
          notification_type: 'INVOICE_ISSUED',
          title: `Hóa đơn xe ${invoice.work_order.vehicle.license_plate} đã được phát hành`,
          message: `Hóa đơn ${invoice.invoice_number} với tổng số tiền ${Number(invoice.total_amount).toLocaleString('vi-VN')} đ đã sẵn sàng thanh toán.`,
          entity_type: 'INVOICE',
          entity_id: invoice.id,
        },
      });

      // Gửi email phát hành hóa đơn nếu khách hàng có email
      if (invoice.work_order.customer?.email) {
        const emailData = buildInvoiceIssuedEmail({
          customerName: invoice.work_order.customer.full_name,
          invoiceNumber: invoice.invoice_number,
          licensePlate: invoice.work_order.vehicle.license_plate,
          vehicleName: `${invoice.work_order.vehicle.make} ${invoice.work_order.vehicle.model}`,
          totalAmount: Number(invoice.total_amount),
          amountDue: Number(invoice.total_amount),
          issuedAt,
        });
        notificationService.sendEmail(
          invoice.work_order.customer.email,
          emailData.subject,
          emailData.html
        );
      }

      return {
        id: updatedInvoice.id,
        invoiceNumber: updatedInvoice.invoice_number,
        status: updatedInvoice.status,
        issuedAt: updatedInvoice.issued_at,
        totalAmount: Number(updatedInvoice.total_amount),
        amountDue: Number(updatedInvoice.amount_due),
        message: 'Phát hành hóa đơn thành công và đã thông báo tới khách hàng.',
      };
    });
  }

  /**
   * Hủy hóa đơn (UC-27: Cancel Invoice)
   */
  async cancelInvoice(invoiceId: number, userId: number, reason: string) {
    return await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          payments: {
            where: { status: 'SUCCESS' },
          },
        },
      });

      if (!invoice) {
        const err: any = new Error('Không tìm thấy hóa đơn');
        err.statusCode = 404;
        throw err;
      }

      if (invoice.status === 'PAID') {
        const err: any = new Error('Không thể hủy hóa đơn đã thanh toán thành công (PAID).');
        err.statusCode = 422;
        throw err;
      }

      if (invoice.status === 'CANCELLED') {
        const err: any = new Error('Hóa đơn này đã được hủy trước đó.');
        err.statusCode = 422;
        throw err;
      }

      if (invoice.payments && invoice.payments.length > 0) {
        const err: any = new Error(
          'Không thể hủy hóa đơn đã có khoản thanh toán thành công được ghi nhận.'
        );
        err.statusCode = 422;
        throw err;
      }

      const cancelledAt = new Date();

      // Hủy tất cả các giao dịch thanh toán đang ở trạng thái PENDING (nếu có)
      await tx.payment.updateMany({
        where: { invoice_id: invoiceId, status: 'PENDING' },
        data: {
          status: 'FAILED',
          failure_reason: `Hóa đơn đã bị hủy: ${reason}`,
        },
      });

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'CANCELLED',
          cancelled_at: cancelledAt,
          cancel_reason: reason.trim(),
        },
      });

      // Ghi Audit Log
      await tx.auditLog.create({
        data: {
          user_id: userId,
          action: AuditAction.STATUS_CHANGE,
          entity_type: 'INVOICE',
          entity_id: invoiceId,
          before_data: { status: invoice.status },
          after_data: { status: 'CANCELLED', cancelledAt, cancelReason: reason },
        },
      });

      return {
        id: updatedInvoice.id,
        invoiceNumber: updatedInvoice.invoice_number,
        status: updatedInvoice.status,
        cancelledAt: updatedInvoice.cancelled_at,
        cancelReason: updatedInvoice.cancel_reason,
        message: 'Đã hủy hóa đơn thành công.',
      };
    });
  }

  /**
   * Lấy danh sách hóa đơn của khách hàng đăng nhập kèm thống kê Bento (UC-16)
   */
  async getMyInvoices(
    userId: number,
    filters: { status?: string; search?: string; page?: number; limit?: number } = {}
  ) {
    const { status, search, page = 1, limit = 20 } = filters;

    // Lấy thống kê tổng quan của toàn bộ hóa đơn khách hàng
    const allCustomerInvoices = await prisma.invoice.findMany({
      where: {
        work_order: {
          customer_id: userId,
        },
      },
      select: {
        status: true,
        total_amount: true,
        amount_due: true,
      },
    });

    let totalSpent = 0;
    let pendingAmount = 0;
    let pendingCount = 0;

    for (const inv of allCustomerInvoices) {
      if (inv.status === 'PAID') {
        totalSpent += Number(inv.total_amount);
      } else if (inv.status === 'ISSUED') {
        pendingAmount += Number(inv.amount_due);
        pendingCount += 1;
      }
    }

    const rewardPoints = Math.floor(totalSpent / 10000);

    // Bộ lọc truy vấn danh sách hóa đơn
    const where: Prisma.InvoiceWhereInput = {
      work_order: {
        customer_id: userId,
      },
    };

    if (status && status !== 'ALL') {
      where.status = status as InvoiceStatus;
    }

    if (search) {
      where.OR = [
        { invoice_number: { contains: search } },
        {
          work_order: {
            vehicle: {
              license_plate: { contains: search },
            },
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, records] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        include: {
          work_order: {
            include: {
              vehicle: {
                select: {
                  id: true,
                  license_plate: true,
                  make: true,
                  model: true,
                  year: true,
                  color: true,
                },
              },
              services: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          payments: {
            select: {
              id: true,
              payment_method: true,
              amount: true,
              paid_at: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const formattedInvoices = records.map((inv: any) => {
      const primaryServiceDesc =
        (inv.work_order?.services || []).map((s: any) => s.name).join(', ') ||
        'Dịch vụ bảo dưỡng & sửa chữa';
      const lastPayment = inv.payments?.[0];

      return {
        id: inv.id,
        workOrderId: inv.work_order_id,
        invoiceNumber: inv.invoice_number,
        status: inv.status,
        subtotal: Number(inv.subtotal),
        discountAmount: Number(inv.discount_amount),
        taxAmount: Number(inv.tax_amount),
        totalAmount: Number(inv.total_amount),
        amountDue: Number(inv.amount_due),
        issuedAt: inv.issued_at,
        createdAt: inv.created_at,
        vehicle: {
          id: inv.work_order?.vehicle?.id,
          licensePlate: inv.work_order?.vehicle?.license_plate,
          make: inv.work_order?.vehicle?.make,
          model: inv.work_order?.vehicle?.model,
          year: inv.work_order?.vehicle?.year,
        },
        primaryServiceDescription: primaryServiceDesc,
        paymentMethodDisplay: lastPayment ? lastPayment.payment_method : null,
      };
    });

    return {
      invoices: formattedInvoices,
      summary: {
        totalSpent,
        pendingAmount,
        pendingCount,
        rewardPoints,
      },
      pagination: {
        total,
        count: records.length,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit,
      },
    };
  }

  /**
   * Lấy chi tiết hóa đơn (kèm kiểm tra bảo mật: chỉ chủ sở hữu hoặc nhân viên mới được xem)
   */
  async getInvoiceById(id: number, userId: number, userRole: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        work_order: {
          include: {
            customer: {
              select: {
                id: true,
                full_name: true,
                phone: true,
                email: true,
              },
            },
            vehicle: {
              select: {
                id: true,
                license_plate: true,
                make: true,
                model: true,
                year: true,
                color: true,
              },
            },
            advisor: {
              select: {
                id: true,
                full_name: true,
                phone: true,
              },
            },
          },
        },
        created_by: {
          select: { id: true, full_name: true, email: true },
        },
        issued_by: {
          select: { id: true, full_name: true, email: true },
        },
        lines: {
          include: {
            quotation_line: {
              select: {
                id: true,
                quotation: {
                  select: { id: true, quotation_number: true, quotation_type: true },
                },
              },
            },
            wo_service: { select: { id: true, name: true } },
            job: { select: { id: true, name: true } },
          },
          orderBy: { sort_order: 'asc' },
        },
        payments: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!invoice) {
      const err: any = new Error('Không tìm thấy hóa đơn');
      err.statusCode = 404;
      throw err;
    }

    // Security Check: Customer chỉ được xem hóa đơn của chính mình
    if (userRole === 'CUSTOMER' && invoice.work_order.customer_id !== userId) {
      const err: any = new Error('Bạn không có quyền truy cập hóa đơn này');
      err.statusCode = 403;
      throw err;
    }

    return {
      id: invoice.id,
      workOrderId: invoice.work_order_id,
      woNumber: invoice.work_order.wo_number,
      invoiceNumber: invoice.invoice_number,
      status: invoice.status,
      subtotal: Number(invoice.subtotal),
      discountAmount: Number(invoice.discount_amount),
      discountReason: invoice.discount_reason,
      taxAmount: Number(invoice.tax_amount),
      totalAmount: Number(invoice.total_amount),
      amountDue: Number(invoice.amount_due),
      notes: invoice.notes,
      issuedAt: invoice.issued_at,
      paidAt: invoice.paid_at,
      cancelledAt: invoice.cancelled_at,
      cancelReason: invoice.cancel_reason,
      createdAt: invoice.created_at,
      updatedAt: invoice.updated_at,
      customer: {
        id: invoice.work_order.customer.id,
        fullName: invoice.work_order.customer.full_name,
        phone: invoice.work_order.customer.phone,
        email: invoice.work_order.customer.email,
      },
      vehicle: {
        id: invoice.work_order.vehicle.id,
        licensePlate: invoice.work_order.vehicle.license_plate,
        make: invoice.work_order.vehicle.make,
        model: invoice.work_order.vehicle.model,
        year: invoice.work_order.vehicle.year,
        color: invoice.work_order.vehicle.color,
      },
      advisor: {
        id: invoice.work_order.advisor.id,
        fullName: invoice.work_order.advisor.full_name,
        phone: invoice.work_order.advisor.phone,
      },
      createdBy: invoice.created_by,
      issuedBy: invoice.issued_by,
      lines: invoice.lines.map((l: any) => ({
        id: l.id,
        lineType: l.line_type,
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unit_price),
        amount: Number(l.amount),
        sortOrder: l.sort_order,
        quotationNumber: l.quotation_line?.quotation?.quotation_number || null,
        serviceName: l.wo_service?.name || null,
        jobName: l.job?.name || null,
      })),
      payments: invoice.payments.map((p: any) => ({
        id: p.id,
        paymentMethod: p.payment_method,
        amount: Number(p.amount),
        tenderedAmount: p.tendered_amount ? Number(p.tendered_amount) : null,
        paidAt: p.paid_at,
        transactionRef: p.transaction_ref,
        status: p.status,
        failureReason: p.failure_reason,
        createdAt: p.created_at,
      })),
    };
  }

  /**
   * Xuất tài liệu hóa đơn PDF (UC-27 / FR-18)
   */
  async generateInvoicePdf(id: number, userId: number, userRole: string): Promise<Buffer> {
    const invoice = await this.getInvoiceById(id, userId, userRole);

    const pdfData = {
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      createdAt: invoice.createdAt,
      customerName: invoice.customer.fullName,
      customerPhone: invoice.customer.phone || undefined,
      customerEmail: invoice.customer.email || undefined,
      licensePlate: invoice.vehicle.licensePlate,
      vehicleName: `${invoice.vehicle.make} ${invoice.vehicle.model} (${invoice.vehicle.year})`,
      advisorName: invoice.advisor.fullName,
      creatorName: invoice.createdBy?.full_name || undefined,
      subtotal: invoice.subtotal,
      discountAmount: invoice.discountAmount,
      discountReason: invoice.discountReason || undefined,
      totalAmount: invoice.totalAmount,
      amountDue: invoice.amountDue,
      paidAt: invoice.paidAt,
      paymentMethod: invoice.payments?.[0]?.paymentMethod || undefined,
      lines: invoice.lines.map((l: any) => ({
        serviceName: l.serviceName || undefined,
        lineType: l.lineType,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        amount: l.amount,
      })),
    };

    return await generateInvoicePdfBuffer(pdfData);
  }
}

export const invoiceService = new InvoiceService();
