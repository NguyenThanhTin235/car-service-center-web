import prisma from '../utils/prisma';
import { InvoiceStatus, Prisma } from '@prisma/client';

export class InvoiceService {
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
      const primaryServiceDesc = (inv.work_order?.services || []).map((s: any) => s.name).join(', ') || 'Dịch vụ bảo dưỡng & sửa chữa';
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
        lines: {
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
      invoiceNumber: invoice.invoice_number,
      status: invoice.status,
      subtotal: Number(invoice.subtotal),
      discountAmount: Number(invoice.discount_amount),
      taxAmount: Number(invoice.tax_amount),
      totalAmount: Number(invoice.total_amount),
      amountDue: Number(invoice.amount_due),
      issuedAt: invoice.issued_at,
      createdAt: invoice.created_at,
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
      lines: invoice.lines.map((l: any) => ({
        id: l.id,
        lineType: l.line_type,
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unit_price),
        amount: Number(l.amount),
        sortOrder: l.sort_order,
      })),
      payments: invoice.payments.map((p: any) => ({
        id: p.id,
        paymentMethod: p.payment_method,
        amount: Number(p.amount),
        paidAt: p.paid_at,
        transactionRef: p.transaction_ref,
        status: p.status,
      })),
    };
  }
}

export const invoiceService = new InvoiceService();
