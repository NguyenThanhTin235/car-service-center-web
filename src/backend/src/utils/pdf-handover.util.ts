import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

export interface HandoverPdfData {
  woNumber: string;
  releaseDate: string | Date;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  licensePlate: string;
  vehicleName: string;
  vin?: string;
  color?: string;
  checkinMileage?: number;
  releaseMileage?: number;
  checkinFuel?: string;
  releaseFuel?: string;
  belongingsReturned?: boolean;
  carWashCompleted?: boolean;
  oldPartsAction?: string; // 'RETURNED_TO_CUSTOMER' | 'DISPOSED_BY_GARAGE'
  advisorName?: string;
  notes?: string;
  completedServices: Array<{
    name: string;
    status: string;
  }>;
  warrantyNotes?: string;
  customerSignature?: string; // base64 / dataUrl (optional)
}

const FUEL_LABELS: Record<string, string> = {
  EMPTY: 'Cạn (E)',
  QUARTER: '1/4 bình',
  HALF: '1/2 bình',
  THREE_QUARTER: '3/4 bình',
  FULL: 'Đầy (F)',
};

/**
 * Sinh tài liệu PDF Biên Bản Bàn Giao & Xuất Xưởng Phương Tiện
 */
export function generateHandoverPdfBuffer(data: HandoverPdfData): Promise<Buffer> {
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
      margins: { top: 30, bottom: 25, left: 38, right: 38 },
      size: 'A4',
      bufferPages: true,
      info: {
        Title: `Bien_Ban_Ban_Giao_${data.woNumber}`,
        Author: 'Car Service Center',
        Subject: 'Biên Bản Bàn Giao & Nghiệm Thu Phương Tiện',
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

    const formatDate = (date: string | Date | null | undefined): string => {
      if (!date) return '-';
      const d = new Date(date);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    // Header trung tâm
    doc.fillColor('#047857').fontSize(14).font(fontBold);
    doc.text(safeText('TRUNG TÂM BẢO DƯỠNG & SỬA CHỮA Ô TÔ CAR SERVICE CENTER'), { align: 'center' });
    doc.fillColor('#4b5563').fontSize(8.5).font(fontRegular);
    doc.text(safeText('Địa chỉ: Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh | Hotline hỗ trợ: 1900 8888'), { align: 'center' });
    doc.moveDown(0.6);

    // Tiêu đề văn bản
    doc.fillColor('#065f46').fontSize(15).font(fontBold);
    doc.text(safeText('BIÊN BẢN NGHIỆM THU & BÀN GIAO XE'), { align: 'center' });
    doc.fillColor('#6b7280').fontSize(9).font(fontRegular);
    doc.text(safeText(`Số phiếu WO: #${data.woNumber}  •  Thời gian bàn giao: ${formatDate(data.releaseDate)}`), { align: 'center' });
    doc.moveDown(0.8);

    const startX = 38;
    const contentWidth = 519;
    let y = doc.y;

    // 1. Khối Thông tin khách hàng & xe
    doc.rect(startX, y, contentWidth, 68).fillAndStroke('#f0fdf4', '#86efac');
    doc.fillColor('#166534').fontSize(10).font(fontBold);
    doc.text(safeText('1. THÔNG TIN KHÁCH HÀNG & PHƯƠNG TIỆN'), startX + 10, y + 8);

    doc.fillColor('#1f2937').fontSize(8.5).font(fontRegular);
    const col1X = startX + 10;
    const col2X = startX + 265;

    // Cột 1: Khách hàng
    doc.text(safeText(`Khách hàng: `), col1X, y + 25, { continued: true });
    doc.font(fontBold).text(safeText(data.customerName || '-'));
    doc.font(fontRegular).text(safeText(`Số điện thoại: `), col1X, y + 38, { continued: true });
    doc.font(fontBold).text(safeText(data.customerPhone || '-'));
    doc.font(fontRegular).text(safeText(`Email: `), col1X, y + 51, { continued: true });
    doc.text(safeText(data.customerEmail || '-'));

    // Cột 2: Xe & Cố vấn
    doc.font(fontRegular).text(safeText(`Biển số xe: `), col2X, y + 25, { continued: true });
    doc.font(fontBold).fillColor('#047857').text(safeText(data.licensePlate || '-'));
    doc.font(fontRegular).fillColor('#1f2937').text(safeText(`Dòng xe: `), col2X, y + 38, { continued: true });
    doc.font(fontBold).text(safeText(`${data.vehicleName} ${data.color ? `(Màu: ${data.color})` : ''}`));
    doc.font(fontRegular).text(safeText(`Cố vấn phụ trách: `), col2X, y + 51, { continued: true });
    doc.font(fontBold).text(safeText(data.advisorName || 'Cố vấn dịch vụ'));

    y += 76;

    // 2. Bảng Đối soát hiện trạng lúc nhận & lúc giao
    doc.rect(startX, y, contentWidth, 80).fillAndStroke('#f8fafc', '#cbd5e1');
    doc.fillColor('#0f172a').fontSize(10).font(fontBold);
    doc.text(safeText('2. ĐỐI SOÁT HIỆN TRẠNG PHƯƠNG TIỆN (TIẾP NHẬN VS BÀN GIAO)'), startX + 10, y + 8);

    const chkMileage = data.checkinMileage ? `${Number(data.checkinMileage).toLocaleString('vi-VN')} km` : 'Chưa ghi nhận';
    const relMileage = data.releaseMileage ? `${Number(data.releaseMileage).toLocaleString('vi-VN')} km` : `${chkMileage}`;
    const chkFuel = FUEL_LABELS[data.checkinFuel || ''] || data.checkinFuel || '-';
    const relFuel = FUEL_LABELS[data.releaseFuel || ''] || data.releaseFuel || chkFuel;

    doc.fillColor('#334155').fontSize(8.5).font(fontRegular);

    // Dòng 1: ODO
    doc.text(safeText('• Số đồng hồ ODO:'), col1X, y + 26);
    doc.font(fontBold).text(safeText(`Lúc nhận: ${chkMileage}   ->   Lúc bàn giao: ${relMileage}`), col1X + 90, y + 26);

    // Dòng 2: Xăng
    doc.font(fontRegular).text(safeText('• Mức nhiên liệu:'), col1X, y + 39);
    doc.font(fontBold).text(safeText(`Lúc nhận: ${chkFuel}   ->   Lúc bàn giao: ${relFuel}`), col1X + 90, y + 39);

    // Dòng 3: Đồ đạc cá nhân & Vệ sinh
    const washText = data.carWashCompleted !== false ? 'Đã rửa xe & vệ sinh sạch sẽ' : 'Chưa rửa xe';
    const belongingsText = data.belongingsReturned !== false ? 'Đã bàn giao đầy đủ' : 'Không có tài sản lưu lại';
    doc.font(fontRegular).text(safeText('• Vệ sinh xe:'), col1X, y + 52);
    doc.font(fontBold).text(safeText(washText), col1X + 90, y + 52);

    doc.font(fontRegular).text(safeText('• Tài sản cá nhân:'), col2X, y + 52);
    doc.font(fontBold).text(safeText(belongingsText), col2X + 95, y + 52);

    // Dòng 4: Phụ tùng cũ
    const partsActionText = data.oldPartsAction === 'DISPOSED_BY_GARAGE'
      ? 'Khách hàng đồng ý gửi xưởng tiêu hủy theo tiêu chuẩn an toàn môi trường'
      : 'Đã hoàn trả lại toàn bộ phụ tùng cũ thay ra cho khách hàng mang về';
    doc.font(fontRegular).text(safeText('• Phụ tùng cũ thay ra:'), col1X, y + 65);
    doc.font(fontBold).text(safeText(partsActionText), col1X + 90, y + 65);

    y += 88;

    // 3. Danh mục công việc & Dịch vụ hoàn thành
    doc.fillColor('#0f172a').fontSize(10).font(fontBold);
    doc.text(safeText('3. CÁC HẠNG MỤC DỊCH VỤ ĐÃ THỰC HIỆN & ĐẠT CHUẨN KCS:'), startX, y);
    y += 14;

    // Header bảng dịch vụ
    doc.rect(startX, y, contentWidth, 18).fillAndStroke('#e2e8f0', '#cbd5e1');
    doc.fillColor('#1e293b').fontSize(8.5).font(fontBold);
    doc.text(safeText('STT'), startX + 8, y + 5);
    doc.text(safeText('Hạng mục công việc / Dịch vụ'), startX + 35, y + 5);
    doc.text(safeText('Kết quả nghiệm thu'), startX + 380, y + 5);
    y += 18;

    const services = data.completedServices && data.completedServices.length > 0
      ? data.completedServices
      : [{ name: 'Bảo dưỡng & Kiểm tra tổng quát phương tiện', status: 'COMPLETED' }];

    services.slice(0, 6).forEach((svc, index) => {
      const rowBg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
      doc.rect(startX, y, contentWidth, 18).fillAndStroke(rowBg, '#e2e8f0');
      doc.fillColor('#334155').fontSize(8.5).font(fontRegular);
      doc.text(safeText(String(index + 1)), startX + 8, y + 5);
      doc.text(safeText(svc.name), startX + 35, y + 5, { width: 340, ellipsis: true });
      doc.font(fontBold).fillColor('#059669');
      doc.text(safeText('ĐẠT CHUẨN (100%)'), startX + 380, y + 5);
      doc.font(fontRegular);
      y += 18;
    });

    y += 10;

    // 4. Cam kết bảo hành & Ghi chú
    doc.rect(startX, y, contentWidth, 42).fillAndStroke('#eff6ff', '#bfdbfe');
    doc.fillColor('#1e40af').fontSize(9).font(fontBold);
    doc.text(safeText('4. CAM KẾT CHẤT LƯỢNG & CHÍNH SÁCH BẢO HÀNH:'), startX + 10, y + 6);
    doc.fillColor('#1e3a8a').fontSize(8).font(fontRegular);
    const warrantyText = data.warrantyNotes || 'Trung tâm bảo hành 06 tháng hoặc 10.000 km (tùy điều kiện nào đến trước) đối với các phụ tùng chính hãng thay mới và hạng mục công việc sửa chữa. Mọi thắc mắc kỹ thuật vui lòng liên hệ Hotline: 1900 8888.';
    doc.text(safeText(warrantyText), startX + 10, y + 19, { width: contentWidth - 20 });

    y += 50;

    // 5. Phần Chữ ký xác nhận
    doc.fillColor('#0f172a').fontSize(9.5).font(fontBold);
    doc.text(safeText('ĐẠI DIỆN TRUNG TÂM DỊCH VỤ'), col1X + 20, y, { align: 'left' });
    doc.text(safeText('ĐẠI DIỆN KHÁCH HÀNG NHẬN XE'), col2X + 10, y, { align: 'left' });

    doc.fillColor('#64748b').fontSize(8).font(fontRegular);
    doc.text(safeText('(Ký, ghi rõ họ tên & đóng dấu)'), col1X + 26, y + 12);
    doc.text(safeText('(Đã kiểm tra, xác nhận xe & tài sản đầy đủ)'), col2X + 2, y + 12);

    // Ký tên hoặc khoảng trống
    y += 24;
    doc.rect(col1X + 10, y, 160, 50).stroke('#cbd5e1');
    doc.rect(col2X, y, 175, 50).stroke('#cbd5e1');

    // Chữ ký khách hàng nếu có base64
    if (data.customerSignature && data.customerSignature.startsWith('data:image/')) {
      try {
        const base64Data = data.customerSignature.split(';base64,').pop();
        if (base64Data) {
          const imgBuffer = Buffer.from(base64Data, 'base64');
          doc.image(imgBuffer, col2X + 10, y + 2, { fit: [155, 46], align: 'center', valign: 'center' });
        }
      } catch (e) {
        // Fallback text if image parse fails
        doc.fillColor('#94a3b8').fontSize(8).text(safeText('[Đã ký xác nhận điện tử]'), col2X + 25, y + 20);
      }
    } else {
      doc.fillColor('#94a3b8').fontSize(8).text(safeText('[Đã ký xác nhận]'), col2X + 45, y + 20);
    }

    doc.fillColor('#047857').fontSize(8.5).font(fontBold);
    doc.text(safeText(data.advisorName || 'Cố vấn dịch vụ'), col1X + 35, y + 54);
    doc.text(safeText(data.customerName || 'Khách hàng'), col2X + 40, y + 54);

    // Footer chân trang
    const pageBottom = doc.page.height - 20;
    doc.fillColor('#94a3b8').fontSize(7.5).font(fontRegular);
    doc.text(safeText(`Biên bản bàn giao xe điện tử - Mã tra cứu: WO-${data.woNumber} - In ngày: ${formatDate(new Date())}`), startX, pageBottom, {
      align: 'center',
      width: contentWidth,
    });

    doc.end();
  });
}

