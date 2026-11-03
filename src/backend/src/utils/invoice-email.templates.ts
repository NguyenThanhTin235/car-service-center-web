import { buildEmailLayout } from './appointment-email.templates';

export interface InvoiceEmailData {
  customerName: string;
  invoiceNumber: string;
  licensePlate: string;
  vehicleName: string;
  totalAmount: number;
  amountDue: number;
  issuedAt?: string | Date;
  paidAt?: string | Date;
  paymentMethod?: string;
  portalUrl?: string;
}

const formatVND = (amount: number): string => {
  return (Number(amount) || 0).toLocaleString('vi-VN') + ' đ';
};

/**
 * Email gửi khách hàng khi hóa đơn được phát hành chính thức (UC-27)
 */
export function buildInvoiceIssuedEmail(data: InvoiceEmailData): { subject: string; html: string } {
  const portalLink = data.portalUrl || 'http://localhost:3000/customer/invoices';
  const subject = `[Car Service Center] Hóa đơn dịch vụ xe ${data.licensePlate} đã được phát hành - Mã: ${data.invoiceNumber}`;

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155;">
      Kính gửi Quý khách <strong>${data.customerName}</strong>,
    </p>
    <p style="margin: 0 0 18px 0; font-size: 14px; color: #475569; line-height: 1.6;">
      Trung tâm Dịch vụ Ô tô xin thông báo: Phiếu dịch vụ của xe <strong>${data.licensePlate} (${data.vehicleName})</strong> đã hoàn tất thi công và kiểm định chất lượng KCS 100%. Hóa đơn chính thức đã được phát hành.
    </p>

    <!-- INVOICE SUMMARY BOX -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b;">Mã hóa đơn:</td>
              <td align="right" style="padding: 6px 0; font-size: 14px; font-weight: bold; color: #0050cd;">${data.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b;">Biển số xe:</td>
              <td align="right" style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #1e293b;">${data.licensePlate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b;">Tổng tiền dịch vụ:</td>
              <td align="right" style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #1e293b;">${formatVND(data.totalAmount)}</td>
            </tr>
            <tr style="border-top: 1px dashed #cbd5e1;">
              <td style="padding: 10px 0 4px 0; font-size: 14px; font-weight: bold; color: #0f172a;">Số tiền cần thanh toán:</td>
              <td align="right" style="padding: 10px 0 4px 0; font-size: 18px; font-weight: 800; color: #d97706;">${formatVND(data.amountDue)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 20px 0; font-size: 13px; color: #64748b; line-height: 1.5;">
      Quý khách có thể thanh toán trực tiếp tại Quầy dịch vụ (Tiền mặt, thẻ ngân hàng hoặc Quét mã VNPay QR) hoặc thanh toán trực tuyến qua cổng Khách hàng.
    </p>

    <!-- ACTION BUTTON -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
      <tr>
        <td align="center">
          <a href="${portalLink}" target="_blank" style="display: inline-block; background-color: #0050cd; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 80, 205, 0.2);">
            Xem chi tiết hóa đơn &amp; Thanh toán
          </a>
        </td>
      </tr>
    </table>
  `;

  const html = buildEmailLayout(
    subject,
    'HÓA ĐƠN MỚI',
    '#e0e7ff',
    '#3730a3',
    contentHtml
  );

  return { subject, html };
}

/**
 * Email gửi khách hàng khi thanh toán thành công (UC-28)
 */
export function buildPaymentSuccessEmail(data: InvoiceEmailData): { subject: string; html: string } {
  const portalLink = data.portalUrl || 'http://localhost:3000/customer/tracking';
  const subject = `[Car Service Center] Xác nhận thanh toán thành công hóa đơn ${data.invoiceNumber} - Xe ${data.licensePlate}`;

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155;">
      Kính gửi Quý khách <strong>${data.customerName}</strong>,
    </p>
    <p style="margin: 0 0 18px 0; font-size: 14px; color: #475569; line-height: 1.6;">
      Trung tâm Dịch vụ Ô tô xin chân thành cảm ơn Quý khách! Khoản thanh toán cho hóa đơn <strong>${data.invoiceNumber}</strong> xe <strong>${data.licensePlate}</strong> đã được ghi nhận thành công 100%.
    </p>

    <!-- PAYMENT RECEIPT BOX -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #166534;">Mã hóa đơn:</td>
              <td align="right" style="padding: 6px 0; font-size: 14px; font-weight: bold; color: #15803d;">${data.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #166534;">Số tiền đã thanh toán:</td>
              <td align="right" style="padding: 6px 0; font-size: 16px; font-weight: 800; color: #15803d;">${formatVND(data.totalAmount)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #166534;">Phương thức thanh toán:</td>
              <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #166534;">${data.paymentMethod || 'VNPay / Tiền mặt / Thẻ'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #166534;">Trạng thái tài chính:</td>
              <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: bold; color: #15803d;">ĐÃ QUYẾT TOÁN (FINANCIAL CLEARED)</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 16px 0; font-size: 14px; color: #15803d; font-weight: bold;">
      🚗 Xe của Quý khách đã sẵn sàng để bàn giao! Cố vấn dịch vụ đang chuẩn bị biên bản bàn giao xe và sẽ liên hệ hỗ trợ Quý khách nhận xe ngay.
    </p>

    <!-- ACTION BUTTON -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
      <tr>
        <td align="center">
          <a href="${portalLink}" target="_blank" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);">
            Theo dõi tiến độ nhận xe
          </a>
        </td>
      </tr>
    </table>
  `;

  const html = buildEmailLayout(
    subject,
    'THANH TOÁN THÀNH CÔNG',
    '#dcfce7',
    '#166534',
    contentHtml
  );

  return { subject, html };
}

