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

    // Header
    doc.fillColor('#1e3a8a').fontSize(14).font(fontBold);
    doc.text(safeText('TRUNG TÂM BẢO DƯỠNG & SỬA CHỮA Ô TÔ CAR SERVICE CENTER'), { align: 'center' });
    doc.fillColor('#4b5563').fontSize(9).font(fontRegular);
    doc.text(safeText('Địa chỉ: Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh | Hotline: 1900 8888'), { align: 'center' });
    doc.moveDown(0.8);

    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#2563eb').lineWidth(2).stroke();
    doc.moveDown(0.8);

    // Tiêu đề hóa đơn
    doc.fillColor('#111827').fontSize(15).font(fontBold);
    doc.text(safeText('HÓA ĐƠN DỊCH VỤ / INVOICE'), { align: 'center' });
    doc.fillColor('#2563eb').fontSize(11).font(fontBold);
    doc.text(`Số HĐ: ${data.invoiceNumber}`, { align: 'center' });

    let statusText = 'CHƯA THANH TOÁN';
    if (data.status === 'PAID') statusText = 'ĐÃ THANH TOÁN (PAID)';
    else if (data.status === 'DRAFT') statusText = 'BẢN NHÁP (DRAFT)';
    else if (data.status === 'CANCELLED') statusText = 'ĐÃ HỦY (CANCELLED)';

    doc.fillColor(data.status === 'PAID' ? '#16a34a' : '#d97706').fontSize(10).font(fontBold);
    doc.text(`[ ${safeText(statusText)} ]`, { align: 'center' });
    doc.moveDown(0.6);

    // Thông tin khách hàng & xe (2 cột)
    const startY = doc.y;
    const colWidth = 240;

    // Cột trái: Khách hàng
    doc.fillColor('#111827').fontSize(9).font(fontBold);
    doc.text(safeText('THÔNG TIN KHÁCH HÀNG:'), 40, startY);
    doc.font(fontRegular).fillColor('#374151');
    doc.text(`${safeText('Họ và tên:')} ${safeText(data.customerName)}`, 40, startY + 14);
    doc.text(`${safeText('Số điện thoại:')} ${data.customerPhone || '-'}`, 40, startY + 26);
    doc.text(`${safeText('Email:')} ${data.customerEmail || '-'}`, 40, startY + 38);

    // Cột phải: Xe & Thời gian
    doc.fillColor('#111827').fontSize(9).font(fontBold);
    doc.text(safeText('THÔNG TIN PHƯƠNG TIỆN:'), 310, startY);
    doc.font(fontRegular).fillColor('#374151');
    doc.text(`${safeText('Biển số xe:')} ${data.licensePlate}`, 310, startY + 14);
    doc.text(`${safeText('Dòng xe:')} ${safeText(data.vehicleName)}`, 310, startY + 26);
    doc.text(`${safeText('Ngày phát hành:')} ${formatDate(data.issuedAt || data.createdAt)}`, 310, startY + 38);

    doc.y = startY + 54;
    doc.moveDown(0.5);

    // Bảng chi tiết
    const tableTop = doc.y;
    doc.rect(40, tableTop, 515, 20).fill('#f3f4f6');
    doc.fillColor('#111827').fontSize(8.5).font(fontBold);

    doc.text(safeText('STT'), 45, tableTop + 5, { width: 30, align: 'center' });
    doc.text(safeText('Nội dung hạng mục'), 80, tableTop + 5, { width: 230, align: 'left' });
    doc.text(safeText('Loại'), 315, tableTop + 5, { width: 60, align: 'center' });
    doc.text(safeText('SL'), 380, tableTop + 5, { width: 35, align: 'center' });
    doc.text(safeText('Đơn giá'), 420, tableTop + 5, { width: 65, align: 'right' });
    doc.text(safeText('Thành tiền'), 490, tableTop + 5, { width: 60, align: 'right' });

    let currentY = tableTop + 22;
    doc.font(fontRegular).fontSize(8).fillColor('#374151');

    data.lines.forEach((line, idx) => {
      if (currentY > 720) {
        doc.addPage();
        currentY = 40;
      }

      if (idx % 2 === 1) {
        doc.rect(40, currentY - 2, 515, 18).fill('#fafafa');
      }

      let typeBadge = 'Công';
      if (line.lineType === 'PART') typeBadge = 'Phụ tùng';
      else if (line.lineType === 'MATERIAL') typeBadge = 'Vật tư';
      else if (line.lineType === 'PACKAGE') typeBadge = 'Gói';
      else if (line.lineType === 'FEE') typeBadge = 'Phí';

      doc.fillColor('#374151');
      doc.text(String(idx + 1), 45, currentY, { width: 30, align: 'center' });
      doc.text(safeText(line.description), 80, currentY, { width: 230, align: 'left' });
      doc.text(safeText(typeBadge), 315, currentY, { width: 60, align: 'center' });
      doc.text(String(line.quantity), 380, currentY, { width: 35, align: 'center' });
      doc.text(formatMoney(line.unitPrice), 420, currentY, { width: 65, align: 'right' });
      doc.text(formatMoney(line.amount), 490, currentY, { width: 60, align: 'right' });

      currentY += 18;
    });

    doc.moveTo(40, currentY).lineTo(555, currentY).strokeColor('#e5e7eb').lineWidth(1).stroke();
    currentY += 8;

    // Tổng kết chi phí
    const summaryX = 350;
    const valueX = 460;
    const valueWidth = 95;

    doc.fontSize(8.5).font(fontRegular).fillColor('#4b5563');
    doc.text(safeText('Tổng tiền dịch vụ (Subtotal):'), summaryX, currentY);
    doc.text(formatMoney(data.subtotal), valueX, currentY, { width: valueWidth, align: 'right' });
    currentY += 14;

    if (data.discountAmount > 0) {
      doc.text(safeText('Chiết khấu / Giảm trừ:'), summaryX, currentY);
      doc.fillColor('#dc2626').text(`- ${formatMoney(data.discountAmount)}`, valueX, currentY, { width: valueWidth, align: 'right' });
      currentY += 14;
      if (data.discountReason) {
        doc.fontSize(7.5).font(fontRegular).fillColor('#6b7280');
        doc.text(`(${safeText('Lý do:')} ${safeText(data.discountReason)})`, summaryX, currentY, { width: 200 });
        currentY += 12;
      }
    }

    doc.fontSize(8.5).font(fontRegular).fillColor('#4b5563');
    doc.text(safeText('Thuế GTGT (VAT 0% - Zero-Tax):'), summaryX, currentY);
    doc.text('0 đ', valueX, currentY, { width: valueWidth, align: 'right' });
    currentY += 16;

    doc.rect(340, currentY - 3, 215, 22).fill('#f0fdf4');
    doc.fillColor('#15803d').fontSize(10).font(fontBold);
    doc.text(safeText('TỔNG THANH TOÁN:'), 345, currentY + 3);
    doc.text(formatMoney(data.totalAmount), valueX, currentY + 3, { width: valueWidth, align: 'right' });
    currentY += 28;

    if (data.status === 'PAID') {
      doc.fillColor('#16a34a').fontSize(8.5).font(fontBold);
      doc.text(`${safeText('Đã thanh toán:')} ${formatMoney(data.totalAmount)} (${data.paymentMethod || 'Thành công'}) - ${formatDate(data.paidAt)}`, 40, currentY);
      currentY += 14;
    } else {
      doc.fillColor('#d97706').fontSize(8.5).font(fontBold);
      doc.text(`${safeText('Số tiền còn phải thanh toán:')} ${formatMoney(data.amountDue)}`, 40, currentY);
      currentY += 14;
    }

    // Bằng chữ
    const words = numberToWordsVietnamese(data.totalAmount);
    doc.fontSize(8).font(fontRegular).fillColor('#4b5563');
    doc.text(`${safeText('Bằng chữ:')} ${safeText(words)}`, 40, currentY, { width: 515 });
    currentY += 25;

    // Chữ ký
    if (currentY > 680) {
      doc.addPage();
      currentY = 40;
    }

    doc.fontSize(8.5).font(fontBold).fillColor('#111827');
    doc.text(safeText('KHÁCH HÀNG'), 70, currentY, { width: 150, align: 'center' });
    doc.text(safeText('ĐẠI DIỆN TRUNG TÂM / THU NGÂN'), 340, currentY, { width: 180, align: 'center' });

    doc.font(fontRegular).fontSize(7.5).fillColor('#6b7280');
    doc.text(safeText('(Ký và ghi rõ họ tên)'), 70, currentY + 12, { width: 150, align: 'center' });
    doc.text(safeText('(Ký, đóng dấu hoặc xác thực điện tử)'), 340, currentY + 12, { width: 180, align: 'center' });

    doc.end();
  });
}

