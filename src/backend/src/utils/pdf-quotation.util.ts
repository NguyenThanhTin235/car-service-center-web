import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { numberToWordsVietnamese } from './number-to-words.util';

export interface QuotationPdfData {
  quotationNumber: string;
  quotationType: string;
  status: string;
  createdAt: string | Date;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  licensePlate: string;
  vehicleName: string;
  advisorName?: string;
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
  lines: Array<{
    serviceName?: string;
    lineType: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    sku?: string;
  }>;
}

/**
 * Sinh tài liệu PDF Báo giá chuyên nghiệp hỗ trợ Unicode tiếng Việt và dãn dòng chuẩn đẹp
 */
export function generateQuotationPdfBuffer(data: QuotationPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Tìm file font TrueType hỗ trợ tiếng Việt
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
        Title: `Bao_Gia_${data.quotationNumber}`,
        Author: 'Car Service Center',
        Subject: 'Bảng Báo Giá Dịch Vụ Ô Tô',
      },
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Đăng ký font nếu có Unicode TTF
    if (isUnicodeSupported) {
      doc.registerFont('AppFont', fontRegular);
      doc.registerFont('AppFont-Bold', fontBold);
    }

    const setFontRegular = () => (isUnicodeSupported ? doc.font('AppFont') : doc.font('Helvetica'));
    const setFontBold = () => (isUnicodeSupported ? doc.font('AppFont-Bold') : doc.font('Helvetica-Bold'));

    const formatVnd = (val: number) => {
      return Number(val || 0).toLocaleString('vi-VN') + ' đ';
    };

    // ================= 1. HEADER (DÃN CÁCH THOÁNG ĐÃNG) =================
    // Logo / Brand (Bên trái)
    setFontBold().fontSize(18).fillColor('#1e40af').text('CAR SERVICE CENTER', 40, 36);
    setFontRegular().fontSize(8.5).fillColor('#4b5563')
      .text('Hệ thống Dịch vụ & Chăm sóc Kỹ thuật Ô tô Toàn diện', 40, 60)
      .text('Hotline CSKH: 1900 6868   •   Email: cskh@carservice.vn', 40, 75)
      .text('Địa chỉ: Trung tâm Kỹ thuật Công nghệ Ô tô, TP. Thủ Đức, TP. Hồ Chí Minh', 40, 90);

    // Tiêu đề Báo Giá & Số hiệu (Bên phải)
    setFontBold().fontSize(15).fillColor('#111827').text('BẢNG BÁO GIÁ DỊCH VỤ', 330, 36, { align: 'right' });
    setFontRegular().fontSize(8.5).fillColor('#4b5563')
      .text(`Số báo giá: ${data.quotationNumber}`, 330, 60, { align: 'right' })
      .text(`Ngày lập: ${new Date(data.createdAt).toLocaleDateString('vi-VN')}`, 330, 75, { align: 'right' })
      .text(`Phân loại: ${data.quotationType === 'PRIMARY' ? 'Báo giá chính thức' : 'Báo giá bổ sung'}`, 330, 90, { align: 'right' });

    // Đường kẻ phân cách Header
    doc.moveTo(40, 108).lineTo(555, 108).strokeColor('#cbd5e1').lineWidth(0.8).stroke();

    // ================= 2. KHUNG THÔNG TIN KHÁCH HÀNG & PHƯƠNG TIỆN =================
    const infoTop = 120;
    const infoHeight = 78;

    // Nền xám nhạt với viền bo nhẹ
    doc.rect(40, infoTop, 515, infoHeight).fillColor('#f8fafc').strokeColor('#e2e8f0').lineWidth(0.6).fillAndStroke();

    // Cột trái: Khách hàng
    setFontBold().fontSize(9.5).fillColor('#1e40af').text('THÔNG TIN KHÁCH HÀNG', 52, infoTop + 10);
    setFontRegular().fontSize(8.5).fillColor('#334155')
      .text(`Họ và tên: ${data.customerName}`, 52, infoTop + 27)
      .text(`Điện thoại: ${data.customerPhone || 'Chưa cập nhật'}`, 52, infoTop + 43)
      .text(`Email: ${data.customerEmail || 'Chưa cập nhật'}`, 52, infoTop + 59);

    // Cột phải: Phương tiện & Cố vấn
    setFontBold().fontSize(9.5).fillColor('#1e40af').text('THÔNG TIN PHƯƠNG TIỆN', 310, infoTop + 10);
    setFontRegular().fontSize(8.5).fillColor('#334155')
      .text(`Biển số xe: ${data.licensePlate}`, 310, infoTop + 27)
      .text(`Dòng xe: ${data.vehicleName}`, 310, infoTop + 43)
      .text(`Cố vấn dịch vụ: ${data.advisorName || 'Tổ tiếp nhận xưởng'}`, 310, infoTop + 59);

    // ================= 3. BẢNG CHI TIẾT HẠNG MỤC =================
    const tableTop = infoTop + infoHeight + 18;
    const headerHeight = 25;

    const renderTableHeader = (y: number) => {
      doc.rect(40, y, 515, headerHeight).fillColor('#1e40af').fill();
      setFontBold().fontSize(8.5).fillColor('#ffffff')
        .text('STT', 42, y + 7, { width: 26, align: 'center' })
        .text('HẠNG MỤC CÔNG VIỆC / PHỤ TÙNG', 72, y + 7, { width: 228 })
        .text('PHÂN LOẠI', 304, y + 7, { width: 60 })
        .text('SL', 368, y + 7, { width: 24, align: 'center' })
        .text('ĐƠN GIÁ (VNĐ)', 396, y + 7, { width: 72, align: 'right' })
        .text('THÀNH TIỀN (VNĐ)', 472, y + 7, { width: 80, align: 'right' });
    };

    renderTableHeader(tableTop);
    let currentY = tableTop + headerHeight;

    data.lines.forEach((item, idx) => {
      setFontRegular().fontSize(8.5);

      const descHeight = doc.heightOfString(item.description, { width: 228, lineGap: 2 });
      const rowHeight = Math.max(descHeight + 14, 28);

      // Tự động ngắt trang nếu vượt quá trang A4
      if (currentY + rowHeight > 720) {
        doc.addPage();
        currentY = 36;
        renderTableHeader(currentY);
        currentY += headerHeight;
      }

      // Kẻ nền xen kẽ (Zebra striping)
      if (idx % 2 === 1) {
        doc.rect(40, currentY, 515, rowHeight).fillColor('#f8fafc').fill();
      }

      const typeLabel =
        item.lineType === 'LABOUR'
          ? 'Nhân công'
          : item.lineType === 'PART'
          ? 'Phụ tùng'
          : item.lineType === 'PACKAGE'
          ? 'Trọn gói'
          : item.lineType === 'FEE'
          ? 'Phụ phí'
          : 'Vật tư';

      const textY = currentY + 7;

      setFontRegular().fontSize(8.5).fillColor('#1e293b')
        .text(String(idx + 1), 42, textY, { width: 26, align: 'center' })
        .text(item.description, 72, textY, { width: 228, lineGap: 2 })
        .text(typeLabel, 304, textY, { width: 60 })
        .text(String(item.quantity), 368, textY, { width: 24, align: 'center' })
        .text(formatVnd(item.unitPrice), 396, textY, { width: 72, align: 'right' });

      setFontBold().fontSize(8.5).fillColor('#0f172a')
        .text(formatVnd(item.amount), 472, textY, { width: 80, align: 'right' });

      // Đường kẻ mờ phân tách hàng
      doc.moveTo(40, currentY + rowHeight).lineTo(555, currentY + rowHeight).strokeColor('#f1f5f9').lineWidth(0.5).stroke();

      currentY += rowHeight;
    });

    // Đường kẻ đáy bảng
    doc.moveTo(40, currentY).lineTo(555, currentY).strokeColor('#cbd5e1').lineWidth(0.8).stroke();

    // ================= 4. KHỐI TỔNG KẾT TÀI CHÍNH ZERO-TAX =================
    // Nếu không đủ chỗ cho summary + terms + signatures (~200pt), tự động ngắt trang gọn gàng
    if (currentY > 580) {
      doc.addPage();
      currentY = 36;
    }

    const summaryTop = currentY + 18;
    const summaryHeight = 86;

    // Hộp tổng kết tiền (căn phải, rộng 270pt)
    doc.rect(285, summaryTop, 270, summaryHeight).fillColor('#f8fafc').strokeColor('#cbd5e1').lineWidth(0.6).fillAndStroke();

    setFontRegular().fontSize(8.5).fillColor('#475569')
      .text('Tạm tính dịch vụ & phụ tùng:', 298, summaryTop + 10, { width: 145, align: 'left' });
    setFontRegular().fontSize(8.5).fillColor('#0f172a')
      .text(formatVnd(data.subtotal), 445, summaryTop + 10, { width: 100, align: 'right' });

    setFontRegular().fontSize(8.5).fillColor('#15803d')
      .text('Chiết khấu ưu đãi (Discount):', 298, summaryTop + 28, { width: 145, align: 'left' });
    setFontRegular().fontSize(8.5).fillColor('#15803d')
      .text(`- ${formatVnd(data.discountAmount)}`, 445, summaryTop + 28, { width: 100, align: 'right' });

    setFontRegular().fontSize(8).fillColor('#64748b')
      .text('Thuế VAT (0% - Không thu thuế):', 298, summaryTop + 46, { width: 145, align: 'left' });
    setFontRegular().fontSize(8).fillColor('#64748b')
      .text('0 đ', 445, summaryTop + 46, { width: 100, align: 'right' });

    // Đường gạch phân cách dòng tổng
    doc.moveTo(298, summaryTop + 61).lineTo(545, summaryTop + 61).strokeColor('#e2e8f0').stroke();

    setFontBold().fontSize(9.5).fillColor('#1e40af')
      .text('TỔNG CỘNG THANH TOÁN:', 298, summaryTop + 67, { width: 145, align: 'left' });
    setFontBold().fontSize(11).fillColor('#1e40af')
      .text(formatVnd(data.grandTotal), 445, summaryTop + 66, { width: 100, align: 'right' });

    // ================= 5. SỐ TIỀN BẰNG CHỮ =================
    const wordsTop = summaryTop + summaryHeight + 16;
    const amountInWords = numberToWordsVietnamese(data.grandTotal);
    setFontRegular().fontSize(9).fillColor('#1e293b')
      .text(`* Bằng chữ: `, 40, wordsTop, { continued: true })
      .font(isUnicodeSupported ? 'AppFont-Bold' : 'Helvetica-Bold')
      .text(amountInWords);

    // ================= 6. ĐIỀU KHOẢN DỊCH VỤ =================
    const termsTop = wordsTop + 20;
    setFontRegular().fontSize(8).fillColor('#64748b')
      .text('• Bảng báo giá có hiệu lực trong vòng 07 ngày kể từ ngày lập.', 40, termsTop)
      .text('• Đơn giá nhân công là chi phí khoán trọn gói cố định theo quy trình kỹ thuật, không tính theo giờ công.', 40, termsTop + 15)
      .text('• 100% linh kiện, phụ tùng thay thế xuất kho chính hãng, có tem truy xuất nguồn gốc và bảo hành theo tiêu chuẩn.', 40, termsTop + 30)
      .text('• Cam kết minh bạch: Trung tâm không thu thêm bất kỳ loại thuế hay phụ phí nào ngoài các hạng mục trong báo giá này.', 40, termsTop + 45);

    // ================= 7. KHỐI CHỮ KÝ 2 BÊN =================
    const sigTop = termsTop + 45 + 36;

    setFontBold().fontSize(10).fillColor('#1e293b')
      .text('ĐẠI DIỆN KHÁCH HÀNG', 80, sigTop, { align: 'center', width: 160 })
      .font(isUnicodeSupported ? 'AppFont' : 'Helvetica').fontSize(8.5).fillColor('#64748b')
      .text('(Ký và ghi rõ họ tên)', 80, sigTop + 16, { align: 'center', width: 160 });

    setFontBold().fontSize(10).fillColor('#1e293b')
      .text('ĐẠI DIỆN CỐ VẤN DỊCH VỤ', 350, sigTop, { align: 'center', width: 160 })
      .font(isUnicodeSupported ? 'AppFont' : 'Helvetica').fontSize(8.5).fillColor('#64748b')
      .text('(Ký và đóng dấu xác nhận)', 350, sigTop + 16, { align: 'center', width: 160 });

    // ================= 8. FOOTER TRANG (DÙNG BUFFERED PAGES, KHÔNG GÂY TRÀN TRANG) =================
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      const footerText = pages.count > 1
        ? `Tài liệu được trích xuất tự động từ Hệ thống Quản trị Car Service Center   •   Trang ${i + 1} / ${pages.count}`
        : 'Tài liệu được trích xuất tự động từ Hệ thống Quản trị Car Service Center';
      doc.fontSize(7.5).fillColor('#94a3b8')
        .text(footerText, 40, 792, { align: 'center', width: 515, lineBreak: false });
    }

    doc.end();
  });
}
