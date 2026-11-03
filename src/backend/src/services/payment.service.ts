import prisma from '../utils/prisma';
import { PaymentMethod, PaymentStatus, AuditAction, WorkOrderStatus } from '@prisma/client';
import { createVnpayPaymentUrl, verifyVnpaySecureHash } from '../utils/vnpay.util';
import { notificationService } from './notification.service';
import { buildPaymentSuccessEmail } from '../utils/invoice-email.templates';

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
            : 'Chuyển khoản VNPay',
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
   * Tạo liên kết và mã QR thanh toán qua cổng VNPay (UC-28 VNPay QR)
   */
  async createVnpayPayment(invoiceId: number, userId: number, clientIp?: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        work_order: {
          include: {
            customer: true,
            vehicle: true,
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
        `Hóa đơn đang ở trạng thái ${invoice.status}. Chỉ có thể tạo mã thanh toán khi hóa đơn ở trạng thái Phát hành (ISSUED).`
      );
      err.statusCode = 422;
      throw err;
    }

    const amountDue = Math.round(Number(invoice.amount_due));
    if (amountDue <= 0) {
      const err: any = new Error('Hóa đơn đã được thanh toán đầy đủ, không còn số tiền phải trả.');
      err.statusCode = 422;
      throw err;
    }

    // Hủy các mã thanh toán QR PENDING cũ của hóa đơn này
    await prisma.payment.updateMany({
      where: { invoice_id: invoiceId, status: PaymentStatus.PENDING },
      data: {
        status: PaymentStatus.FAILED,
        failure_reason: 'Tạo mã QR thanh toán mới',
      },
    });

    const txnRef = this.generateTxnRef(invoice.invoice_number);
    const orderInfo = `Thanh toan hoa don ${invoice.invoice_number} xe ${invoice.work_order.vehicle.license_plate}`;

    const vnpayResult = createVnpayPaymentUrl({
      txnRef,
      amount: amountDue,
      orderInfo,
      ipAddr: clientIp,
    });

    const payment = await prisma.payment.create({
      data: {
        invoice_id: invoiceId,
        payment_method: PaymentMethod.QR_TRANSFER,
        amount: amountDue,
        tendered_amount: amountDue,
        transaction_ref: txnRef,
        gateway_provider: 'VNPAY',
        payment_url: vnpayResult.paymentUrl,
        expires_at: vnpayResult.expireDate,
        status: PaymentStatus.PENDING,
        received_by_id: userId,
      },
    });

    return {
      paymentId: payment.id,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      txnRef,
      paymentUrl: vnpayResult.paymentUrl,
      amount: amountDue,
      expiresAt: vnpayResult.expireDate,
      message: 'Tạo mã QR thanh toán VNPay thành công',
    };
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
   * Xử lý IPN Webhook từ cổng thanh toán VNPay (Server-to-Server, Idempotent)
   */
  async handleVnpayIpn(query: Record<string, any>) {
    // 1. Kiểm tra chữ ký bảo mật
    const hashCheck = verifyVnpaySecureHash(query);
    if (!hashCheck.isValid) {
      return { RspCode: '97', Message: 'Invalid Checksum' };
    }

    const txnRef = String(query.vnp_TxnRef || '');
    const payment = await prisma.payment.findUnique({
      where: { transaction_ref: txnRef },
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

    // 2. Không tìm thấy đơn hàng
    if (!payment) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    // 3. Kiểm tra số tiền: vnp_Amount = VND * 100
    const vnpAmount = Math.round(Number(query.vnp_Amount) / 100);
    const expectedAmount = Math.round(Number(payment.amount));
    if (vnpAmount !== expectedAmount) {
      return { RspCode: '04', Message: 'Invalid amount' };
    }

    // 4. Kiểm tra trạng thái đã xử lý trước đó (Idempotent)
    if (payment.status === PaymentStatus.SUCCESS) {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    // 5. Kiểm tra kết quả giao dịch từ VNPay
    const isSuccess =
      String(query.vnp_ResponseCode) === '00' &&
      String(query.vnp_TransactionStatus || '00') === '00';

    if (isSuccess) {
      await prisma.$transaction(async (tx) => {
        await this.finalizePayment(tx, {
          invoice: payment.invoice,
          paymentId: payment.id,
          paymentMethod: PaymentMethod.QR_TRANSFER,
          amount: expectedAmount,
          transactionRef: txnRef,
          paymentPayload: query,
        });
      });
      return { RspCode: '00', Message: 'Confirm Success' };
    } else {
      // Giao dịch thất bại
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          failure_reason: `VNPay phản hồi mã lỗi: ${query.vnp_ResponseCode}`,
          payment_payload: query,
        },
      });
      return { RspCode: '00', Message: 'Confirm Success' };
    }
  }

  /**
   * Xử lý xác thực khi khách hàng được redirect về từ trang VNPay (Return URL)
   */
  async verifyVnpayReturn(query: Record<string, any>) {
    // 1. Kiểm tra chữ ký bảo mật
    const hashCheck = verifyVnpaySecureHash(query);
    if (!hashCheck.isValid) {
      const err: any = new Error('Chữ ký bảo mật không hợp lệ (Invalid Checksum). Dữ liệu có thể bị can thiệp.');
      err.statusCode = 400;
      throw err;
    }

    const txnRef = String(query.vnp_TxnRef || '');
    const payment = await prisma.payment.findUnique({
      where: { transaction_ref: txnRef },
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
      const err: any = new Error('Không tìm thấy thông tin giao dịch thanh toán.');
      err.statusCode = 404;
      throw err;
    }

    const isSuccess =
      String(query.vnp_ResponseCode) === '00' &&
      String(query.vnp_TransactionStatus || '00') === '00';

    // Nếu VNPay báo thành công và payment chưa cập nhật SUCCESS (do Return URL đến trước IPN)
    if (isSuccess && payment.status !== PaymentStatus.SUCCESS) {
      await prisma.$transaction(async (tx) => {
        await this.finalizePayment(tx, {
          invoice: payment.invoice,
          paymentId: payment.id,
          paymentMethod: PaymentMethod.QR_TRANSFER,
          amount: Math.round(Number(payment.amount)),
          transactionRef: txnRef,
          paymentPayload: query,
        });
      });
    } else if (!isSuccess && payment.status === PaymentStatus.PENDING) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          failure_reason: `Giao dịch thất bại với mã lỗi VNPay: ${query.vnp_ResponseCode}`,
          payment_payload: query,
        },
      });
    }

    return {
      isSuccess,
      paymentId: payment.id,
      invoiceId: payment.invoice_id,
      invoiceNumber: payment.invoice.invoice_number,
      amount: Number(payment.amount),
      transactionRef: txnRef,
      vnpayTransactionNo: query.vnp_TransactionNo || null,
      responseCode: query.vnp_ResponseCode,
      message: isSuccess
        ? 'Giao dịch thanh toán qua VNPay thành công!'
        : `Thanh toán không thành công (Mã lỗi: ${query.vnp_ResponseCode})`,
    };
  }

  /**
   * Giả lập thanh toán VNPay QR thành công (chỉ dùng cho môi trường Test / Dev)
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
        message: 'Giả lập thanh toán VNPay QR thành công!',
      };
    });
  }
}

export const paymentService = new PaymentService();

