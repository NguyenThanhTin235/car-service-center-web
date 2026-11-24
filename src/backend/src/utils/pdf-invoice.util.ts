import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { numberToWordsVietnamese } from './number-to-words.util';

export interface InvoicePdfData {
  invoiceNumber: string;
  status: string;
  issuedAt?: string | Date | null;
  createdAt: string | Date;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  licensePlate: string;
  vehicleName: string;
  advisorName?: string;
  creatorName?: string;
  subtotal: number;
  discountAmount: number;
  discountReason?: string | null;
  totalAmount: number;
  amountDue: number;
  paidAt?: string | Date | null;
  paymentMethod?: string | null;
  lines: Array<{
    serviceName?: string;
    lineType: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt',
  TRANSFER: 'Chuyển khoản ngân hàng',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
  SEPAY: 'Chuyển khoản VietQR (SePay)',
  VIETQR: 'Chuyển khoản VietQR',
  VNPAY: 'Cổng thanh toán VNPay',
  CARD: 'Thẻ tín dụng / ATM',
  POS: 'Quẹt thẻ POS',
};

const LINE_TYPE_LABELS: Record<string, string> = {
  LABOUR: 'Nhân công',
  PART: 'Phụ tùng',
  MATERIAL: 'Vật tư',
  PACKAGE: 'Trọn gói',
  FEE: 'Phụ phí',
};

/**
 * Sinh tài liệu PDF Hóa đơn thanh toán chuyên nghiệp hỗ trợ font tiếng Việt
 */
export function generateInvoicePdfBuffer(data: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const bundledFontRegular = path.join(__dirname, '../../assets/fonts/Arial-Regular.ttf');
    const bundledFontBold = path.join(__dirname, '../../assets/fonts/Arial-Bold.ttf');
    const windowsFontRegular = 'C:/Windows/Fonts/arial.ttf';
    const windowsFontBold = 'C:/Windows/Fonts/arialbd.ttf';

    let fontRegular = 'Helvetica';
    let fontBold = 'Helvetica-Bold';
    let isUnicodeSupported = false;

    if (fs.existsSync(bundledFontRegular) && fs.existsSync(bundledFontBold)) {
      fontRegular = bundledFontRegular;
      fontBold = bundledFontBold;
      isUnicodeSupported = true;
    } else if (fs.existsSync(windowsFontRegular) && fs.existsSync(windowsFontBold)) {
      fontRegular = windowsFontRegular;
      fontBold = windowsFontBold;
      isUnicodeSupported = true;
    }

    const doc = new PDFDocument({
      margins: { top: 32, bottom: 25, left: 40, right: 40 },
      size: 'A4',
      bufferPages: true,
      info: {
        Title: `Hoa_Don_${data.invoiceNumber}`,
        Author: 'Car Service Center',
        Subject: 'Hóa Đơn Dịch Vụ Sửa Chữa Ô Tô',
      },
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    if (isUnicodeSupported) {
      doc.registerFont('AppFont', fontRegular);
      doc.registerFont('AppFont-Bold', fontBold);
    }

    const setFontRegular = () => (isUnicodeSupported ? doc.font('AppFont') : doc.font('Helvetica'));
    const setFontBold = () => (isUnicodeSupported ? doc.font('AppFont-Bold') : doc.font('Helvetica-Bold'));

    const safeText = (text: string | null | undefined): string => {
      if (!text) return '';
      if (isUnicodeSupported) return String(text);
      return String(text)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
    };

    const formatMoney = (val: number): string => {
      return (Number(val) || 0).toLocaleString('vi-VN') + ' đ';
    };

    const formatDate = (date: string | Date | null | undefined): string => {
      if (!date) return '-';
      const d = new Date(date);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    // ================= 1. HEADER TRUNG TÂM =================
    setFontBold().fontSize(14).fillColor('#1e40af')
      .text(safeText('TRUNG TÂM BẢO DƯỠNG & SỬA CHỮA Ô TÔ CAR SERVICE CENTER'), 40, 34, { width: 515, align: 'center' });
    setFontRegular().fontSize(8.5).fillColor('#4b5563')
      .text(safeText('Địa chỉ: Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh   •   Hotline: 1900 6868   •   Email: cskh@carservice.vn'), 40, 54, { width: 515, align: 'center' });

    doc.moveTo(40, 72).lineTo(555, 72).strokeColor('#1e40af').lineWidth(1.5).stroke();

    // ================= 2. TIÊU ĐỀ HÓA ĐƠN =================
    setFontBold().fontSize(15).fillColor('#111827')
      .text(safeText('HÓA ĐƠN DỊCH VỤ / INVOICE'), 40, 82, { width: 515, align: 'center' });
    setFontBold().fontSize(10.5).fillColor('#1e40af')
      .text(safeText(`Số hóa đơn: ${data.invoiceNumber}`), 40, 102, { width: 515, align: 'center' });

    let statusText = 'CHƯA THANH TOÁN';
    let statusColor = '#d97706';
    if (data.status === 'PAID') {
      statusText = 'ĐÃ THANH TOÁN';
      statusColor = '#16a34a';
    } else if (data.status === 'DRAFT') {
      statusText = 'BẢN NHÁP';
      statusColor = '#64748b';
    } else if (data.status === 'CANCELLED') {
      statusText = 'ĐÃ HỦY';
      statusColor = '#dc2626';
    }

    setFontBold().fontSize(9.5).fillColor(statusColor)
      .text(`[ ${safeText(statusText)} ]`, 40, 118, { width: 515, align: 'center' });

    // ================= 3. THÔNG TIN KHÁCH HÀNG & XE (2 CỘT) =================
    const infoTop = 138;
    const infoHeight = 68;
    doc.rect(40, infoTop, 515, infoHeight).fillColor('#f8fafc').strokeColor('#cbd5e1').lineWidth(0.6).fillAndStroke();

    setFontBold().fontSize(9).fillColor('#1e40af')
      .text(safeText('THÔNG TIN KHÁCH HÀNG'), 52, infoTop + 9);
    setFontRegular().fontSize(8.5).fillColor('#334155')
      .text(`${safeText('Họ và tên:')} ${safeText(data.customerName || '-')}`, 52, infoTop + 24, { width: 240 })
      .text(`${safeText('Số điện thoại:')} ${data.customerPhone || '-'}`, 52, infoTop + 38, { width: 240 })
      .text(`${safeText('Email:')} ${data.customerEmail || '-'}`, 52, infoTop + 52, { width: 240 });

    setFontBold().fontSize(9).fillColor('#1e40af')
      .text(safeText('THÔNG TIN PHƯƠNG TIỆN'), 305, infoTop + 9);
    setFontRegular().fontSize(8.5).fillColor('#334155')
      .text(`${safeText('Biển số xe:')} ${safeText(data.licensePlate || '-')}`, 305, infoTop + 24, { width: 240 })
      .text(`${safeText('Dòng xe:')} ${safeText(data.vehicleName || '-')}`, 305, infoTop + 38, { width: 240 })
      .text(`${safeText('Ngày phát hành:')} ${formatDate(data.issuedAt || data.createdAt)}`, 305, infoTop + 52, { width: 240 });

    // ================= 4. BẢNG CHI TIẾT HẠNG MỤC =================
    const tableTop = infoTop + infoHeight + 14;
    const headerHeight = 24;

    const renderTableHeader = (y: number) => {
      doc.rect(40, y, 515, headerHeight).fillColor('#1e40af').fill();
      setFontBold().fontSize(8.5).fillColor('#ffffff')
        .text(safeText('STT'), 42, y + 7, { width: 26, align: 'center' })
        .text(safeText('NỘI DUNG HẠNG MỤC'), 72, y + 7, { width: 228, align: 'left' })
        .text(safeText('LOẠI'), 304, y + 7, { width: 58, align: 'center' })
        .text(safeText('SL'), 366, y + 7, { width: 26, align: 'center' })
        .text(safeText('ĐƠN GIÁ'), 396, y + 7, { width: 72, align: 'right' })
        .text(safeText('THÀNH TIỀN'), 472, y + 7, { width: 78, align: 'right' });
    };

    renderTableHeader(tableTop);
    let currentY = tableTop + headerHeight;

    data.lines.forEach((line, idx) => {
      setFontRegular().fontSize(8.5);
      const desc = safeText(line.description);
      const descHeight = doc.heightOfString(desc, { width: 228, lineGap: 2 });
      const rowHeight = Math.max(descHeight + 12, 24);

      if (currentY + rowHeight > 745) {
        doc.addPage();
        currentY = 36;
        renderTableHeader(currentY);
        currentY += headerHeight;
      }

      if (idx % 2 === 1) {
        doc.rect(40, currentY, 515, rowHeight).fillColor('#f8fafc').fill();
      }

      const typeBadge = LINE_TYPE_LABELS[line.lineType] || 'Dịch vụ';
      const textY = currentY + 6;

      setFontRegular().fontSize(8.5).fillColor('#1e293b')
        .text(String(idx + 1), 42, textY, { width: 26, align: 'center' })
        .text(desc, 72, textY, { width: 228, align: 'left', lineGap: 2 })
        .text(safeText(typeBadge), 304, textY, { width: 58, align: 'center' })
        .text(String(line.quantity), 366, textY, { width: 26, align: 'center' })
        .text(formatMoney(line.unitPrice), 396, textY, { width: 72, align: 'right' });

      setFontBold().fontSize(8.5).fillColor('#0f172a')
        .text(formatMoney(line.amount), 472, textY, { width: 78, align: 'right' });

      doc.moveTo(40, currentY + rowHeight).lineTo(555, currentY + rowHeight).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
      currentY += rowHeight;
    });

    doc.moveTo(40, currentY).lineTo(555, currentY).strokeColor('#cbd5e1').lineWidth(0.8).stroke();
    currentY += 12;

    // ================= 5. TỔNG KẾT CHI PHÍ & CHỮ KÝ =================
    const words = safeText(numberToWordsVietnamese(data.totalAmount));
    setFontRegular().fontSize(8.5);
    const wordsHeight = doc.heightOfString(`${safeText('Bằng chữ:')} ${words}`, { width: 515 });
    const estimatedFooterBlockHeight = 140 + wordsHeight + (data.discountReason ? 16 : 0);

    if (currentY + estimatedFooterBlockHeight > 770) {
      doc.addPage();
      currentY = 40;
    }

    const summaryTop = currentY;
    const hasDiscountReason = data.discountAmount > 0 && Boolean(data.discountReason);
    const summaryHeight = hasDiscountReason ? 100 : 86;

    doc.rect(285, summaryTop, 270, summaryHeight).fillColor('#f8fafc').strokeColor('#cbd5e1').lineWidth(0.6).fillAndStroke();

    const summaryX = 298;
    const valueX = 445;
    const valueWidth = 100;
    let sy = summaryTop + 10;

    setFontRegular().fontSize(8.5).fillColor('#475569')
      .text(safeText('Tổng tiền dịch vụ (Subtotal):'), summaryX, sy, { width: 145 });
    setFontRegular().fontSize(8.5).fillColor('#0f172a')
      .text(formatMoney(data.subtotal), valueX, sy, { width: valueWidth, align: 'right' });
    sy += 17;

    setFontRegular().fontSize(8.5).fillColor('#dc2626')
      .text(safeText('Chiết khấu / Giảm trừ:'), summaryX, sy, { width: 145 })
      .text(data.discountAmount > 0 ? `- ${formatMoney(data.discountAmount)}` : '0 đ', valueX, sy, { width: valueWidth, align: 'right' });
    sy += 15;

    if (hasDiscountReason) {
      setFontRegular().fontSize(7.5).fillColor('#64748b')
        .text(`(${safeText('Lý do:')} ${safeText(data.discountReason)})`, summaryX, sy, { width: 245, ellipsis: true });
      sy += 14;
    }

    setFontRegular().fontSize(8).fillColor('#64748b')
      .text(safeText('Thuế GTGT (VAT 0% - Zero-Tax):'), summaryX, sy, { width: 145 })
      .text('0 đ', valueX, sy, { width: valueWidth, align: 'right' });
    sy += 15;

    doc.moveTo(298, sy).lineTo(545, sy).strokeColor('#cbd5e1').lineWidth(0.6).stroke();
    sy += 6;

    setFontBold().fontSize(9.5).fillColor('#15803d')
      .text(safeText('TỔNG THANH TOÁN:'), summaryX, sy, { width: 145 });
    setFontBold().fontSize(10.5).fillColor('#15803d')
      .text(formatMoney(data.totalAmount), valueX, sy - 1, { width: valueWidth, align: 'right' });

    currentY = summaryTop + summaryHeight + 12;

    if (data.status === 'PAID') {
      const methodLabel = data.paymentMethod
        ? (PAYMENT_METHOD_LABELS[data.paymentMethod.toUpperCase()] || data.paymentMethod)
        : 'Hoàn tất';
      setFontBold().fontSize(8.5).fillColor('#16a34a')
        .text(
          `${safeText('Đã thanh toán:')} ${formatMoney(data.totalAmount)} (${safeText(methodLabel)}) - ${formatDate(data.paidAt)}`,
          40,
          currentY,
          { width: 515 }
        );
      currentY += 15;
    } else if (data.status !== 'CANCELLED') {
      setFontBold().fontSize(8.5).fillColor('#d97706')
        .text(`${safeText('Số tiền còn phải thanh toán:')} ${formatMoney(data.amountDue)}`, 40, currentY, { width: 515 });
      currentY += 15;
    }

    // Bằng chữ
    setFontRegular().fontSize(8.5).fillColor('#1e293b')
      .text(`${safeText('* Bằng chữ:')} `, 40, currentY, { continued: true })
      .font(isUnicodeSupported ? 'AppFont-Bold' : 'Helvetica-Bold')
      .text(words, { width: 515 });

    currentY += wordsHeight + 24;

    if (currentY > 710) {
      doc.addPage();
      currentY = 40;
    }

    // Chữ ký
    setFontBold().fontSize(9).fillColor('#1e293b')
      .text(safeText('KHÁCH HÀNG'), 70, currentY, { width: 160, align: 'center' })
      .text(safeText('ĐẠI DIỆN TRUNG TÂM / THU NGÂN'), 335, currentY, { width: 190, align: 'center' });

    setFontRegular().fontSize(8).fillColor('#64748b')
      .text(safeText('(Ký và ghi rõ họ tên)'), 70, currentY + 14, { width: 160, align: 'center' })
      .text(safeText('(Ký, đóng dấu hoặc xác thực điện tử)'), 335, currentY + 14, { width: 190, align: 'center' });

    // Footer trang
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      const footerText = pages.count > 1
        ? `Tài liệu được trích xuất tự động từ Hệ thống Quản trị Car Service Center   •   Trang ${i + 1} / ${pages.count}`
        : 'Tài liệu được trích xuất tự động từ Hệ thống Quản trị Car Service Center';
      setFontRegular().fontSize(7.5).fillColor('#94a3b8')
        .text(safeText(footerText), 40, 792, { align: 'center', width: 515, lineBreak: false });
    }

    doc.end();
  });
}
