import prisma from '../utils/prisma';
import { PaymentMethod, PaymentStatus, AuditAction, WorkOrderStatus } from '@prisma/client';
import { notificationService } from './notification.service';
import { buildPaymentSuccessEmail } from '../utils/invoice-email.templates';
import {
  initSepayOneTimePaymentFields,
  verifySepayIpnSecretKey,
  extractInvoiceNumberFromContent,
  SepayIpnPayload,
} from '../utils/sepay.util';

export interface RecordManualPaymentInput {
  paymentMethod: 'CASH' | 'CARD';
  amount: number;
  tenderedAmount?: number;
  transactionRef?: string;
}

export class PaymentService {
  /**
   * Sinh mã tham chiếu giao dịch nội bộ
   */
  private generateTxnRef(invoiceNumber: string): string {
    const cleanNum = invoiceNumber.replace(/[^A-Za-z0-9]/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `PAY-${cleanNum}-${Date.now().toString().slice(-4)}${rand}`;
  }

  /**
   * Hoàn tất quyết toán tài chính 100% trong 1 transaction duy nhất (BR-INV-05)
   * Cập nhật Payment -> SUCCESS, Invoice -> PAID, WorkOrder -> FINANCIAL_CLEARED,
   * Gửi thông báo cho SA (VEHICLE_READY) và Khách hàng (PAYMENT_SUCCESS), Ghi AuditLog.
   */
  async finalizePayment(
    tx: any,
    params: {
      invoice: any;
      paymentId: number;
      paymentMethod: PaymentMethod;
      amount: number;
      tenderedAmount?: number | null;
      transactionRef?: string | null;
      paymentPayload?: any;
      receivedById?: number | null;
    }
  ) {
    const paidAt = new Date();
    const invoice = params.invoice;

    // 1. Cập nhật Payment sang SUCCESS
    const updatedPayment = await tx.payment.update({
      where: { id: params.paymentId },
      data: {
        status: PaymentStatus.SUCCESS,
        paid_at: paidAt,
        amount: params.amount,
        tendered_amount: params.tenderedAmount ?? params.amount,
        transaction_ref: params.transactionRef || undefined,
        payment_payload: params.paymentPayload || undefined,
        received_by_id: params.receivedById || undefined,
      },
    });

    // 2. Cập nhật Invoice sang PAID (Amount Due = 0)
    const updatedInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'PAID',
        amount_due: 0,
        paid_at: paidAt,
      },
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

    // 3. Kích hoạt Financial Gate: Chuyển Work Order sang FINANCIAL_CLEARED
    let updatedWorkOrder: any = null;
    if (updatedInvoice.work_order.status === WorkOrderStatus.BILLING_REQUESTED) {
      updatedWorkOrder = await tx.workOrder.update({
        where: { id: updatedInvoice.work_order_id },
        data: {
          status: WorkOrderStatus.FINANCIAL_CLEARED,
        },
      });

      // Audit Log cho Work Order
      await tx.auditLog.create({
        data: {
          user_id: params.receivedById || updatedInvoice.work_order.advisor_id,
          action: AuditAction.STATUS_CHANGE,
          entity_type: 'WORK_ORDER',
          entity_id: updatedInvoice.work_order_id,
          before_data: { status: WorkOrderStatus.BILLING_REQUESTED },
          after_data: { status: WorkOrderStatus.FINANCIAL_CLEARED, triggeredBy: 'PAYMENT_SUCCESS' },
        },
      });
    }

    // 4. Audit Log cho Invoice
    await tx.auditLog.create({
      data: {
        user_id: params.receivedById || updatedInvoice.work_order.advisor_id,
        action: AuditAction.STATUS_CHANGE,
        entity_type: 'INVOICE',
        entity_id: invoice.id,
        before_data: { status: 'ISSUED', amountDue: Number(invoice.amount_due) },
        after_data: {
          status: 'PAID',
          amountDue: 0,
          paymentId: updatedPayment.id,
          paidAt,
        },
      },
    });

    // 5. Gửi thông báo cho Cố vấn dịch vụ (SA): Xe sẵn sàng để bàn giao
    await tx.notification.create({
      data: {
        user_id: updatedInvoice.work_order.advisor_id,
        notification_type: 'VEHICLE_READY',
        title: `Xe ${updatedInvoice.work_order.vehicle.license_plate} đã quyết toán tài chính 100%`,
        message: `Hóa đơn ${updatedInvoice.invoice_number} đã được thanh toán thành công. Xe sẵn sàng để thực hiện bàn giao cho khách hàng.`,
        entity_type: 'WORK_ORDER',
        entity_id: updatedInvoice.work_order_id,
      },
    });

    // 6. Gửi thông báo cho Khách hàng
    await tx.notification.create({
      data: {
        user_id: updatedInvoice.work_order.customer_id,
        notification_type: 'PAYMENT_SUCCESS',
        title: `Thanh toán thành công hóa đơn ${updatedInvoice.invoice_number}`,
        message: `Quý khách đã thanh toán ${Number(params.amount).toLocaleString('vi-VN')} đ. Xe của Quý khách đã sẵn sàng để nhận lại!`,
        entity_type: 'INVOICE',
        entity_id: updatedInvoice.id,
      },
    });

    // 7. Gửi email xác nhận thanh toán nếu khách hàng có email
    if (updatedInvoice.work_order.customer?.email) {
      const emailData = buildPaymentSuccessEmail({
        customerName: updatedInvoice.work_order.customer.full_name,
        invoiceNumber: updatedInvoice.invoice_number,
        licensePlate: updatedInvoice.work_order.vehicle.license_plate,
        vehicleName: `${updatedInvoice.work_order.vehicle.make} ${updatedInvoice.work_order.vehicle.model}`,
        totalAmount: Number(params.amount),
        amountDue: 0,
        paidAt,
        paymentMethod:
          params.paymentMethod === 'CASH'
            ? 'Tiền mặt'
            : params.paymentMethod === 'CARD'
            ? 'Thẻ ngân hàng'
            : 'Chuyển khoản trực tuyến',
      });
      notificationService.sendEmail(
        updatedInvoice.work_order.customer.email,
        emailData.subject,
        emailData.html
      );
    }

    return {
      payment: updatedPayment,
      invoice: updatedInvoice,
      workOrder: updatedWorkOrder,
    };
  }

  /**
   * Ghi nhận thanh toán thủ công: Tiền mặt hoặc Thẻ quẹt tại quầy (UC-28 Manual Payment)
   */
  async recordManualPayment(invoiceId: number, userId: number, data: RecordManualPaymentInput) {
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

      if (invoice.status !== 'ISSUED') {
        const err: any = new Error(
          `Hóa đơn đang ở trạng thái ${invoice.status}. Chỉ có thể ghi nhận thanh toán khi hóa đơn đã được Phát hành (ISSUED).`
        );
        err.statusCode = 422;
        throw err;
      }

      const amountDue = Math.round(Number(invoice.amount_due));
      const payAmount = Math.round(Number(data.amount));

      // Quy tắc MVP: Thanh toán đủ 100% (Full payment)
      if (payAmount !== amountDue) {
        const err: any = new Error(
          `Số tiền thanh toán phải bằng đúng số tiền còn phải trả (${amountDue.toLocaleString('vi-VN')} đ).`
        );
        err.statusCode = 422;
        throw err;
      }

      let tendered = data.tenderedAmount !== undefined ? Math.round(Number(data.tenderedAmount)) : payAmount;
      if (data.paymentMethod === 'CASH' && tendered < payAmount) {
        const err: any = new Error(
          `Số tiền khách đưa (${tendered.toLocaleString('vi-VN')} đ) không được nhỏ hơn số tiền thanh toán (${payAmount.toLocaleString('vi-VN')} đ).`
        );
        err.statusCode = 422;
        throw err;
      }

      const changeAmount = Math.max(0, tendered - payAmount);
      const txnRef = data.transactionRef?.trim() || this.generateTxnRef(invoice.invoice_number);

      // Tạo bản ghi Payment
      const payment = await tx.payment.create({
        data: {
          invoice_id: invoiceId,
          payment_method: data.paymentMethod as PaymentMethod,
          amount: payAmount,
          tendered_amount: tendered,
          transaction_ref: txnRef,
          gateway_provider: 'MANUAL',
          status: PaymentStatus.PENDING,
          received_by_id: userId,
        },
      });

      // Hoàn tất thanh toán tài chính
      const result = await this.finalizePayment(tx, {
        invoice,
        paymentId: payment.id,
        paymentMethod: data.paymentMethod as PaymentMethod,
        amount: payAmount,
        tenderedAmount: tendered,
        transactionRef: txnRef,
        receivedById: userId,
      });

      return {
        paymentId: result.payment.id,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        paymentMethod: data.paymentMethod,
        amount: payAmount,
        tenderedAmount: tendered,
        changeAmount,
        transactionRef: txnRef,
        paidAt: result.payment.paid_at,
        invoiceStatus: result.invoice.status,
        workOrderStatus: result.workOrder ? result.workOrder.status : invoice.work_order.status,
        message: 'Ghi nhận thanh toán thành công và đã hoàn tất tài chính.',
      };
    });
  }

  /**
   * Tra cứu trạng thái giao dịch thanh toán (hỗ trợ Polling và tự động kiểm tra hết hạn)
   */
  async getPaymentStatus(paymentId: number) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: {
          include: {
            work_order: {
              select: { id: true, wo_number: true, status: true },
            },
          },
        },
      },
    });

    if (!payment) {
      const err: any = new Error('Không tìm thấy giao dịch thanh toán');
      err.statusCode = 404;
      throw err;
    }

    // Kiểm tra timeout nếu payment vẫn đang PENDING
    if (payment.status === PaymentStatus.PENDING && payment.expires_at) {
      if (new Date() > payment.expires_at) {
        const updated = await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.FAILED,
            failure_reason: 'Giao dịch hết thời gian chờ thanh toán (Timeout 15 phút)',
          },
        });
        return {
          id: updated.id,
          status: updated.status,
          amount: Number(updated.amount),
          failureReason: updated.failure_reason,
          paidAt: updated.paid_at,
          expiresAt: updated.expires_at,
          invoice: {
            id: payment.invoice.id,
            invoiceNumber: payment.invoice.invoice_number,
            status: payment.invoice.status,
            amountDue: Number(payment.invoice.amount_due),
          },
          workOrder: payment.invoice.work_order,
        };
      }
    }

    return {
      id: payment.id,
      status: payment.status,
      amount: Number(payment.amount),
      failureReason: payment.failure_reason,
      paidAt: payment.paid_at,
      expiresAt: payment.expires_at,
      invoice: {
        id: payment.invoice.id,
        invoiceNumber: payment.invoice.invoice_number,
        status: payment.invoice.status,
        amountDue: Number(payment.invoice.amount_due),
      },
      workOrder: payment.invoice.work_order,
    };
  }

  /**
   * Hủy giao dịch thanh toán đang ở trạng thái PENDING để chuyển phương thức khác (UC-28)
   */
  async cancelPendingPayment(paymentId: number, userId: number, reason?: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      const err: any = new Error('Không tìm thấy giao dịch thanh toán');
      err.statusCode = 404;
      throw err;
    }

    if (payment.status !== PaymentStatus.PENDING) {
      const err: any = new Error(
        `Giao dịch đang ở trạng thái ${payment.status}. Chỉ có thể hủy giao dịch đang Chờ thanh toán (PENDING).`
      );
      err.statusCode = 422;
      throw err;
    }

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.FAILED,
        failure_reason: reason?.trim() || 'Nhân viên quầy hủy để chuyển phương thức khác',
      },
    });

    return {
      id: updated.id,
      status: updated.status,
      failureReason: updated.failure_reason,
      message: 'Đã hủy giao dịch thanh toán đang chờ.',
    };
  }

  /**
   * Giả lập thanh toán QR thành công (chỉ dùng cho môi trường Test / Dev)
   */
  async simulateQrSuccess(paymentId: number, userId: number) {
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
          invoice: {
            include: {
              work_order: {
                include: { customer: true, vehicle: true, advisor: true },
              },
            },
          },
        },
      });

      if (!payment) {
        const err: any = new Error('Không tìm thấy giao dịch thanh toán');
        err.statusCode = 404;
        throw err;
      }

      if (payment.status === PaymentStatus.SUCCESS) {
        return {
          paymentId: payment.id,
          invoiceId: payment.invoice_id,
          status: 'SUCCESS',
          message: 'Giao dịch đã được thanh toán trước đó.',
        };
      }

      const mockPayload = {
        vnp_ResponseCode: '00',
        vnp_TransactionStatus: '00',
        vnp_TransactionNo: `SIMULATED_${Date.now()}`,
        simulated: true,
      };

      const result = await this.finalizePayment(tx, {
        invoice: payment.invoice,
        paymentId: payment.id,
        paymentMethod: PaymentMethod.QR_TRANSFER,
        amount: Math.round(Number(payment.amount)),
        transactionRef: payment.transaction_ref,
        paymentPayload: mockPayload,
        receivedById: userId,
      });

      return {
        paymentId: result.payment.id,
        invoiceId: result.invoice.id,
        invoiceNumber: result.invoice.invoice_number,
        status: result.payment.status,
        amount: Number(result.payment.amount),
        workOrderStatus: result.workOrder ? result.workOrder.status : payment.invoice.work_order.status,
        message: 'Giả lập thanh toán trực tuyến thành công!',
      };
    });
  }

  /**
   * Tạo phiên thanh toán SePay (VietQR / Napas) cho hóa đơn
   */
  async createSepayPayment(
    invoiceId: number,
    userId: number,
    userRoles?: string[],
    returnUrl?: string,
    cancelUrl?: string
  ) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        work_order: {
          include: { customer: true, vehicle: true, advisor: true },
        },
      },
    });

    if (!invoice) {
      const err: any = new Error('Hóa đơn không tồn tại.');
      err.statusCode = 404;
      throw err;
    }

    // Kiểm tra quyền hạn nếu là CUSTOMER
    const isCustomer = userRoles?.includes('CUSTOMER');
    if (isCustomer && invoice.work_order.customer_id !== userId) {
      const err: any = new Error('Bạn không có quyền thanh toán hóa đơn này.');
      err.statusCode = 403;
      throw err;
    }

    if (invoice.status === 'PAID') {
      const err: any = new Error('Hóa đơn đã được thanh toán hoàn tất.');
      err.statusCode = 400;
      throw err;
    }

    if (invoice.status === 'CANCELLED') {
      const err: any = new Error('Hóa đơn đã bị hủy, không thể thanh toán.');
      err.statusCode = 422;
      throw err;
    }

    const amountDue = Math.round(Number(invoice.amount_due));
    if (amountDue <= 0) {
      const err: any = new Error('Số tiền cần thanh toán phải lớn hơn 0.');
      err.statusCode = 400;
      throw err;
    }

    // Đánh dấu FAILED các giao dịch PENDING trước đó của hóa đơn này
    await prisma.payment.updateMany({
      where: {
        invoice_id: invoiceId,
        status: PaymentStatus.PENDING,
      },
      data: {
        status: PaymentStatus.FAILED,
        failure_reason: 'Khởi tạo phiên thanh toán SePay mới',
      },
    });

    // Tạo mã đơn hàng duy nhất cho SePay
    const orderInvoiceNumber = `${invoice.invoice_number}-${Date.now().toString().slice(-4)}`;

    const { checkoutUrl, fields } = initSepayOneTimePaymentFields({
      order_invoice_number: orderInvoiceNumber,
      order_amount: amountDue,
      order_description: `Thanh toan HD ${invoice.invoice_number}`,
      success_url: returnUrl,
      cancel_url: cancelUrl,
      customer_id: String(invoice.work_order.customer_id),
    });

    const payment = await prisma.payment.create({
      data: {
        invoice_id: invoice.id,
        amount: amountDue,
        payment_method: PaymentMethod.QR_TRANSFER,
        status: PaymentStatus.PENDING,
        transaction_ref: orderInvoiceNumber,
        payment_url: checkoutUrl,
        expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 phút
      },
    });

    const bankCode = process.env.SEPAY_BANK_CODE || 'MB';
    const bankName = process.env.SEPAY_BANK_NAME || 'MBBank';
    const bankAccountNo = process.env.SEPAY_BANK_ACCOUNT_NO || '0379888888';
    const bankAccountName = process.env.SEPAY_BANK_ACCOUNT_NAME || 'CAR SERVICE CENTER';
    const transferContent = invoice.invoice_number;
    const qrCodeUrl = `https://qr.sepay.vn/img?acc=${encodeURIComponent(bankAccountNo)}&bank=${encodeURIComponent(bankCode)}&amount=${amountDue}&des=${encodeURIComponent(transferContent)}&template=compact`;

    return {
      paymentId: payment.id,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      amount: amountDue,
      checkoutUrl,
      fields,
      expiresAt: payment.expires_at,
      bankInfo: {
        bankCode,
        bankName,
        accountNumber: bankAccountNo,
        accountName: bankAccountName,
        transferContent,
        amount: amountDue,
        qrCodeUrl,
      },
    };
  }

  /**
   * Phương thức chung xử lý quyết toán hóa đơn khi nhận thông báo thanh toán từ SePay
   */
  private async processPaymentSettlement(params: {
    orderInvoiceNumber: string;
    paidAmount: number;
    transactionId: string;
    rawPayload: any;
  }) {
    const { orderInvoiceNumber, paidAmount, transactionId, rawPayload } = params;

    // Tìm payment theo transaction_ref trước, hoặc tìm theo invoice_number
    let payment: any = await prisma.payment.findUnique({
      where: { transaction_ref: orderInvoiceNumber },
      include: {
        invoice: {
          include: {
            work_order: {
              include: { customer: true, vehicle: true, advisor: true },
            },
          },
        },
      },
    });

    if (!payment) {
      // 1. Chuẩn hóa mã hóa đơn: Tạo các biến thể có/không có dấu gạch nối
      const variants = new Set<string>();
      variants.add(orderInvoiceNumber);
      variants.add(orderInvoiceNumber.replace(/[^A-Za-z0-9]/g, ''));

      // Nếu ngân hàng gửi dạng không dấu gạch: INV2026113163 -> tạo biến thể INV-202611-3163
      const rawDigitsMatch = orderInvoiceNumber.match(/^INV(\d{6})(\d{3,4})$/i);
      if (rawDigitsMatch) {
        variants.add(`INV-${rawDigitsMatch[1]}-${rawDigitsMatch[2]}`);
      }

      // Nếu có suffix 4 số ngẫu nhiên: INV-202611-3163-1234 -> tạo biến thể INV-202611-3163
      const suffixMatch = orderInvoiceNumber.match(/^(INV-\d+-\d+)-\d+$/i);
      if (suffixMatch) {
        variants.add(suffixMatch[1]);
      }

      // Thử tìm theo danh sách các biến thể
      let invoice = await prisma.invoice.findFirst({
        where: {
          invoice_number: { in: Array.from(variants) },
        },
        include: {
          work_order: {
            include: { customer: true, vehicle: true, advisor: true },
          },
          payments: {
            where: { status: PaymentStatus.PENDING },
            orderBy: { id: 'desc' },
          },
        },
      });

      // Nếu vẫn chưa thấy, tìm trong các hóa đơn chưa quyết toán bằng chuỗi chuẩn hóa chỉ gồm chữ và số
      if (!invoice) {
        const cleanTarget = orderInvoiceNumber.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        const pendingInvoices = await prisma.invoice.findMany({
          where: { status: { in: ['ISSUED', 'DRAFT'] } },
          include: {
            work_order: {
              include: { customer: true, vehicle: true, advisor: true },
            },
            payments: {
              where: { status: PaymentStatus.PENDING },
              orderBy: { id: 'desc' },
            },
          },
        });

        invoice =
          pendingInvoices.find(
            (inv) => inv.invoice_number.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === cleanTarget
          ) || null;
      }

      if (!invoice) {
        // Hỗ trợ nút "Gửi thử" của SePay khi truyền mã giao dịch mẫu/test
        const isTestCode =
          orderInvoiceNumber.toUpperCase().includes('TEST') ||
          orderInvoiceNumber === '0' ||
          rawPayload?.id === 1 ||
          rawPayload?.is_test === true;

        if (isTestCode) {
          return {
            success: true,
            message: `Xác nhận webhook test từ SePay thành công (mã thử nghiệm: ${orderInvoiceNumber})`,
          };
        }

        const err: any = new Error(`Không tìm thấy hóa đơn tương ứng với mã: ${orderInvoiceNumber}`);
        err.statusCode = 404;
        throw err;
      }

      if (invoice.payments && invoice.payments.length > 0) {
        payment = {
          ...invoice.payments[0],
          invoice,
        };
      } else {
        // Tạo payment mới nếu chưa có bản ghi pending (ví dụ khách quét mã VietQR tĩnh chuyển thẳng)
        const newPayment = await prisma.payment.create({
          data: {
            invoice_id: invoice.id,
            amount: paidAmount > 0 ? paidAmount : Math.round(Number(invoice.amount_due)),
            payment_method: PaymentMethod.QR_TRANSFER,
            status: PaymentStatus.PENDING,
            transaction_ref: orderInvoiceNumber,
          },
        });
        payment = {
          ...newPayment,
          invoice,
        };
      }
    }

    // Idempotency: Nếu đã SUCCESS thì trả về thành công ngay lập tức
    if (payment.status === PaymentStatus.SUCCESS || payment.invoice.status === 'PAID') {
      return {
        success: true,
        message: 'Hóa đơn đã được quyết toán thành công trước đó.',
        paymentId: payment.id,
        invoiceId: payment.invoice.id,
        invoiceNumber: payment.invoice.invoice_number,
      };
    }

    const finalAmount = paidAmount > 0 ? paidAmount : Math.round(Number(payment.amount));

    return await prisma.$transaction(async (tx) => {
      const result = await this.finalizePayment(tx, {
        invoice: payment.invoice,
        paymentId: payment.id,
        paymentMethod: PaymentMethod.QR_TRANSFER,
        amount: finalAmount,
        transactionRef: transactionId,
        paymentPayload: rawPayload,
      });

      return {
        success: true,
        paymentId: result.payment.id,
        invoiceId: result.invoice.id,
        invoiceNumber: result.invoice.invoice_number,
        message: 'Thanh toán SePay thành công. Hóa đơn đã được quyết toán!',
      };
    });
  }

  /**
   * Xử lý IPN / Webhook từ SePay (Hỗ trợ cả SePay Payment Gateway và SePay Bank Hub Webhook)
   */
  async handleSepayIpn(
    payload: any,
    secretKeyHeader?: string | string[],
    authHeader?: string | string[]
  ) {
    if (!verifySepayIpnSecretKey(secretKeyHeader, authHeader)) {
      const err: any = new Error('Unauthorized: Khóa xác thực X-Secret-Key hoặc API Key không hợp lệ.');
      err.statusCode = 401;
      throw err;
    }

    // 1. Kiểm tra nếu là payload từ SePay Bank Hub Webhook (my.sepay.vn Webhook chuyển khoản ngân hàng)
    const isBankHub =
      payload &&
      (payload.transferType !== undefined ||
        payload.transferAmount !== undefined ||
        payload.gateway !== undefined);

    if (isBankHub) {
      if (payload.transferType && payload.transferType !== 'in') {
        return {
          success: true,
          message: `Bỏ qua giao dịch tiền ra (transferType: ${payload.transferType})`,
        };
      }

      // Trích xuất mã hóa đơn từ payload.code hoặc từ regex nội dung ck (content)
      const extractedCode = payload.code || extractInvoiceNumberFromContent(payload.content);
      if (!extractedCode) {
        return {
          success: true,
          message: `Bỏ qua giao dịch: Không tìm thấy mã hóa đơn (INV-...) trong nội dung "${payload.content}"`,
        };
      }

      const orderInvoiceNumber = extractedCode;
      const paidAmount = Math.round(Number(payload.transferAmount || 0));
      const transactionId = String(payload.referenceCode || payload.id || `SEPAY_${Date.now()}`);

      return await this.processPaymentSettlement({
        orderInvoiceNumber,
        paidAmount,
        transactionId,
        rawPayload: payload,
      });
    }

    // 2. Xử lý payload từ SePay Payment Gateway Checkout (sepay-pg)
    const notificationType = payload?.notification_type;
    const orderStatus = payload?.order?.order_status;

    if (notificationType !== 'ORDER_PAID' && orderStatus !== 'CAPTURED') {
      return {
        success: true,
        message: `Bỏ qua thông báo không phải thanh toán thành công (type: ${notificationType})`,
      };
    }

    const orderInvoiceNumber = payload?.order?.order_invoice_number;
    if (!orderInvoiceNumber) {
      const err: any = new Error('Dữ liệu IPN thiếu order_invoice_number.');
      err.statusCode = 400;
      throw err;
    }

    const paidAmount = Math.round(Number(payload?.order?.order_amount || 0));
    const transactionId = payload?.transaction?.transaction_id || orderInvoiceNumber;

    return await this.processPaymentSettlement({
      orderInvoiceNumber,
      paidAmount,
      transactionId,
      rawPayload: payload,
    });
  }

  /**
   * Tra cứu trạng thái thanh toán hiện tại của hóa đơn
   */
  async getInvoicePaymentStatus(invoiceId: number, userId?: number, userRoles?: string[]) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        work_order: true,
        payments: {
          orderBy: { id: 'desc' },
          take: 1,
        },
      },
    });

    if (!invoice) {
      const err: any = new Error('Hóa đơn không tồn tại.');
      err.statusCode = 404;
      throw err;
    }

    const isCustomer = userRoles?.includes('CUSTOMER');
    if (isCustomer && userId && invoice.work_order?.customer_id !== userId) {
      const err: any = new Error('Bạn không có quyền xem thông tin hóa đơn này.');
      err.statusCode = 403;
      throw err;
    }

    const latestPayment = invoice.payments[0] || null;

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      status: invoice.status,
      amountDue: Number(invoice.amount_due),
      totalAmount: Number(invoice.total_amount),
      isPaid: invoice.status === 'PAID',
      workOrderStatus: invoice.work_order?.status || null,
      payment: latestPayment
        ? {
            id: latestPayment.id,
            status: latestPayment.status,
            amount: Number(latestPayment.amount),
            paymentMethod: latestPayment.payment_method,
            transactionRef: latestPayment.transaction_ref,
            paidAt: latestPayment.paid_at,
          }
        : null,
    };
  }
}

export const paymentService = new PaymentService();

