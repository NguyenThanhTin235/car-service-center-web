export interface EmailAppointmentDetails {
  customerName: string;
  licensePlate?: string;
  vehicleModel?: string;
  scheduledDate: string;
  scheduledTime: string;
  oldScheduledDate?: string;
  oldScheduledTime?: string;
  services?: string[];
  notes?: string;
  cancelReason?: string;
}

/**
 * Khung sườn Email chuẩn Responsive với bảng màu của hệ thống:
 * Primary: #0050cd (Deep Electric Blue)
 * Primary Dark: #003fa5
 * Surface tint: #0866ff
 * Background: #f4f6fb
 * Text: #191c1f, Muted: #64748b
 */
export function buildEmailLayout(title: string, badgeText: string, badgeBg: string, badgeTextColor: string, contentHtml: string): string {
  return `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <!--[if mso]>
    <noscript>
      <xml>
        <o:OfficeDocumentSettings>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    </noscript>
    <![endif]-->
  </head>
  <body style="margin: 0; padding: 0; background-color: #f1f4f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; -webkit-font-smoothing: antialiased;">
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f1f4f9; padding: 36px 12px;">
      <tr>
        <td align="center">
          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 80, 205, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04); border: 1px solid #e2e8f0;">
            
            <!-- TOP BRAND BAR -->
            <tr>
              <td style="background: linear-gradient(135deg, #0050cd 0%, #003387 100%); padding: 24px 32px; text-align: left;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-right: 12px;" valign="middle">
                            <div style="background-color: rgba(255, 255, 255, 0.2); width: 38px; height: 38px; border-radius: 10px; text-align: center; line-height: 38px; font-size: 20px;">
                              🚗
                            </div>
                          </td>
                          <td valign="middle">
                            <h1 style="margin: 0; color: #ffffff; font-size: 19px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">CAR SERVICE CENTER</h1>
                            <p style="margin: 2px 0 0 0; color: #cddbff; font-size: 12px; font-weight: 500;">HỆ THỐNG DỊCH VỤ & CHĂM SÓC Ô TÔ CHUYÊN NGHIỆP</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td align="right" valign="middle">
                      <span style="background-color: ${badgeBg}; color: ${badgeTextColor}; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.12);">
                        ${badgeText}
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- DECORATIVE ACCENT LINE -->
            <tr>
              <td style="height: 4px; background: linear-gradient(90deg, #38bdf8 0%, #0050cd 50%, #6366f1 100%); line-height: 4px; font-size: 4px;">&nbsp;</td>
            </tr>

            <!-- MAIN CONTENT AREA -->
            <tr>
              <td style="padding: 36px 32px 28px 32px;">
                ${contentHtml}
              </td>
            </tr>

            <!-- QUICK SUPPORT CTA -->
            <tr>
              <td style="padding: 0 32px 28px 32px;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 16px 20px;">
                  <tr>
                    <td width="36" valign="middle">
                      <div style="background-color: #e0f2fe; width: 32px; height: 32px; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">
                        📞
                      </div>
                    </td>
                    <td style="padding-left: 10px;" valign="middle">
                      <p style="margin: 0; font-size: 13px; color: #334155;">
                        Cần hỗ trợ hoặc thay đổi gấp? Hotline trực 24/7: <strong style="color: #0050cd; font-size: 14px;">1900 6868</strong>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
                <p style="margin: 0 0 6px 0; color: #64748b; font-size: 12.5px;">
                  📍 <strong>Trụ sở trung tâm:</strong> Số 123 Đường Số 1, TP. Thủ Đức, TP. Hồ Chí Minh
                </p>
                <p style="margin: 0 0 12px 0; color: #64748b; font-size: 12.5px;">
                  ⏱️ <strong>Giờ phục vụ:</strong> 08:00 - 17:00 (Từ Thứ Hai đến Thứ Bảy hàng tuần)
                </p>
                <div style="height: 1px; background-color: #e2e8f0; width: 120px; margin: 12px auto;"></div>
                <p style="margin: 0; color: #94a3b8; font-size: 11.5px; line-height: 1.5;">
                  Email thông báo tự động từ hệ thống quản lý xưởng Car Service Center.<br>
                  Quý khách vui lòng không trả lời (reply) trực tiếp vào địa chỉ thư này.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

/**
 * 1. Template: Tạo lịch hẹn thành công (UC-11 & UC-17)
 */
export function renderAppointmentCreatedTemplate(details: EmailAppointmentDetails): string {
  const servicesListHtml = details.services && details.services.length > 0
    ? details.services.map(s => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 12px; color: #0050cd; font-size: 16px; width: 24px;" valign="top">✓</td>
          <td style="padding: 10px 12px; color: #1e293b; font-size: 14px; font-weight: 500;">${s}</td>
        </tr>
      `).join('')
    : `
        <tr>
          <td colspan="2" style="padding: 12px; color: #64748b; font-size: 13.5px; font-style: italic;">
            Chưa chỉ định trước dịch vụ chi tiết (Cố vấn sẽ kiểm tra tổng thể khi xe đến xưởng).
          </td>
        </tr>
      `;

  const content = `
    <!-- GREETING -->
    <h2 style="margin: 0 0 14px 0; color: #0f172a; font-size: 18px; font-weight: 700;">
      Kính chào Quý khách ${details.customerName},
    </h2>
    <p style="margin: 0 0 24px 0; color: #475569; font-size: 14.5px; line-height: 1.6;">
      Yêu cầu đặt lịch bảo dưỡng & sửa chữa ô tô của Quý khách đã được ghi nhận thành công trên hệ thống. Nhân viên phụ trách sẽ sẵn sàng đón tiếp theo thời gian dưới đây:
    </p>

    <!-- KEY HIGHLIGHT CARD -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f0f7ff; border: 1.5px solid #bfdbfe; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
      <tr>
        <td style="padding: 20px;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" valign="top" style="padding-right: 12px; border-right: 1px solid #dbeafe;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">GIỜ & NGÀY HẸN</p>
                <p style="margin: 0; font-size: 18px; color: #0050cd; font-weight: 800;">
                  ${details.scheduledTime}
                </p>
                <p style="margin: 2px 0 0 0; font-size: 14px; color: #1e293b; font-weight: 600;">
                  ${details.scheduledDate}
                </p>
              </td>
              <td width="50%" valign="top" style="padding-left: 20px;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">THÔNG TIN PHƯƠNG TIỆN</p>
                <div style="margin: 0;">
                  ${details.licensePlate ? `
                    <span style="display: inline-block; background-color: #ffffff; color: #0f172a; font-weight: 700; font-size: 14px; padding: 3px 10px; border-radius: 6px; border: 1.5px solid #94a3b8; font-family: monospace; letter-spacing: 0.5px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                      ${details.licensePlate}
                    </span>
                  ` : '<span style="color: #64748b;">Chưa có biển số</span>'}
                </div>
                ${details.vehicleModel ? `
                  <p style="margin: 6px 0 0 0; font-size: 13.5px; color: #334155; font-weight: 600;">
                    ${details.vehicleModel}
                  </p>
                ` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- SERVICES REQUESTED -->
    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
        HẠNG MỤC DỊCH VỤ ĐĂNG KÝ:
      </h3>
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
        ${servicesListHtml}
      </table>
    </div>

    ${details.notes ? `
    <!-- NOTES -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase;">Ghi chú yêu cầu của khách hàng:</p>
      <p style="margin: 0; font-size: 13.5px; color: #334155; line-height: 1.5; white-space: pre-line;">${details.notes}</p>
    </div>
    ` : ''}

    <!-- IMPORTANT ADVICE -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-left: 4px solid #0050cd; border-radius: 0 8px 8px 0; margin-bottom: 8px;">
      <tr>
        <td style="padding: 14px 18px;">
          <p style="margin: 0; font-size: 13.5px; color: #1e40af; line-height: 1.5;">
            <strong>Mẹo hữu ích:</strong> Quý khách nên đến xưởng trước <strong>10 - 15 phút</strong> so với lịch hẹn để Cố vấn dịch vụ tiếp nhận xe, kiểm tra tình trạng ban đầu và tư vấn nhanh chóng nhất.
          </p>
        </td>
      </tr>
    </table>
  `;

  return buildEmailLayout('Xác nhận đặt lịch hẹn dịch vụ', 'ĐÃ TIẾP NHẬN', '#0050cd', '#ffffff', content);
}

/**
 * 2. Template: Dời lịch hẹn (UC-13 & UC-19)
 */
export function renderAppointmentRescheduledTemplate(details: EmailAppointmentDetails): string {
  const content = `
    <!-- GREETING -->
    <h2 style="margin: 0 0 14px 0; color: #0f172a; font-size: 18px; font-weight: 700;">
      Kính chào Quý khách ${details.customerName},
    </h2>
    <p style="margin: 0 0 24px 0; color: #475569; font-size: 14.5px; line-height: 1.6;">
      Lịch hẹn dịch vụ của Quý khách đã được <strong>cập nhật lại thời gian đón tiếp</strong> trên hệ thống. Dưới đây là thông tin chi tiết:
    </p>

    <!-- COMPARISON BOX -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: 1px solid #fed7aa; border-radius: 12px; background-color: #fffaf0; margin-bottom: 24px; overflow: hidden;">
      
      ${details.oldScheduledDate ? `
      <!-- OLD TIME -->
      <tr>
        <td style="padding: 16px 20px; border-bottom: 1px dashed #fdba74; background-color: #fff7ed;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td width="35%" style="font-size: 13px; color: #9a3412; font-weight: 600;">
                🕒 Thời gian cũ (đã hủy):
              </td>
              <td style="font-size: 14px; color: #94a3b8; text-decoration: line-through; font-weight: 600;">
                ${details.oldScheduledTime || ''} - Ngày ${details.oldScheduledDate}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ` : ''}

      <!-- NEW TIME -->
      <tr>
        <td style="padding: 20px; background-color: #ffffff;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td width="35%" valign="top" style="font-size: 13.5px; color: #c2410c; font-weight: 700; padding-top: 2px;">
                ⏰ THỜI GIAN MỚI:
              </td>
              <td valign="top">
                <span style="font-size: 19px; color: #ea580c; font-weight: 800; display: inline-block;">
                  ${details.scheduledTime}
                </span>
                <span style="font-size: 16px; color: #1e293b; font-weight: 700; margin-left: 8px;">
                  - Ngày ${details.scheduledDate}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- VEHICLE -->
      <tr>
        <td style="padding: 16px 20px; border-top: 1px solid #f1f5f9; background-color: #f8fafc;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td width="35%" style="font-size: 13px; color: #64748b; font-weight: 600;">
                🚗 Phương tiện hẹn:
              </td>
              <td>
                ${details.licensePlate ? `
                  <span style="display: inline-block; background-color: #ffffff; color: #0f172a; font-weight: 700; font-size: 13.5px; padding: 2px 8px; border-radius: 5px; border: 1.5px solid #94a3b8; font-family: monospace;">
                    ${details.licensePlate}
                  </span>
                ` : ''}
                ${details.vehicleModel ? `<span style="font-size: 13.5px; color: #334155; font-weight: 600; margin-left: 6px;">(${details.vehicleModel})</span>` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>

    ${details.notes ? `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase;">Ghi chú thay đổi:</p>
      <p style="margin: 0; font-size: 13.5px; color: #334155; line-height: 1.5;">${details.notes}</p>
    </div>
    ` : ''}

    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
      Quý khách vui lòng sắp xếp thời gian đưa xe đến xưởng đúng thời gian đã cập nhật. Nếu cần điều chỉnh thêm hoặc có trở ngại phát sinh, xin vui lòng liên hệ hotline để nhân viên hỗ trợ ngay.
    </p>
  `;

  return buildEmailLayout('Thông báo dời lịch hẹn dịch vụ', 'ĐÃ DỜI LỊCH', '#ea580c', '#ffffff', content);
}

/**
 * 3. Template: Hủy lịch hẹn (UC-14 & UC-20)
 */
export function renderAppointmentCancelledTemplate(details: EmailAppointmentDetails): string {
  const content = `
    <!-- GREETING -->
    <h2 style="margin: 0 0 14px 0; color: #0f172a; font-size: 18px; font-weight: 700;">
      Kính chào Quý khách ${details.customerName},
    </h2>
    <p style="margin: 0 0 24px 0; color: #475569; font-size: 14.5px; line-height: 1.6;">
      Hệ thống thông báo: Lịch hẹn dịch vụ của Quý khách đã được <strong>xác nhận hủy bỏ</strong> theo yêu cầu.
    </p>

    <!-- CANCELLATION DETAILS -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #fff5f5; border: 1px solid #fecaca; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
      <tr>
        <td style="padding: 20px;">
          <table width="100%" border="0" cellpadding="8" cellspacing="0" style="font-size: 14px;">
            <tr>
              <td width="35%" style="color: #64748b; font-weight: 600;">📅 Lịch hẹn bị hủy:</td>
              <td style="color: #991b1b; font-weight: 700; font-size: 15px;">
                ${details.scheduledTime} - Ngày ${details.scheduledDate}
              </td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">🚗 Phương tiện:</td>
              <td style="color: #1e293b; font-weight: 600;">
                ${details.licensePlate ? `
                  <span style="display: inline-block; background-color: #ffffff; color: #0f172a; font-weight: 700; font-size: 13.5px; padding: 2px 8px; border-radius: 5px; border: 1.5px solid #94a3b8; font-family: monospace;">
                    ${details.licensePlate}
                  </span>
                ` : ''}
                ${details.vehicleModel ? `(${details.vehicleModel})` : ''}
              </td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;" valign="top">⚠️ Lý do hủy lịch:</td>
              <td style="color: #b91c1c; font-weight: 600; font-style: italic;">
                ${details.cancelReason || 'Theo yêu cầu của khách hàng hoặc trung tâm'}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
      Trung tâm rất tiếc vì chưa có cơ hội được phục vụ Quý khách trong đợt này. Quý khách hoàn toàn có thể đặt lại lịch hẹn mới bất cứ lúc nào qua website hoặc gọi điện cho chúng tôi.
    </p>
  `;

  return buildEmailLayout('Thông báo hủy lịch hẹn dịch vụ', 'ĐÃ HỦY LỊCH', '#dc2626', '#ffffff', content);
}

/**
 * 4. Template: Xác nhận lịch hẹn thành công (UC-12 Cố vấn/Lễ tân xác nhận)
 */
export function renderAppointmentConfirmedTemplate(details: EmailAppointmentDetails): string {
  const servicesListHtml = details.services && details.services.length > 0
    ? details.services.map(s => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 12px; color: #059669; font-size: 16px; width: 24px;" valign="top">✓</td>
          <td style="padding: 10px 12px; color: #1e293b; font-size: 14px; font-weight: 500;">${s}</td>
        </tr>
      `).join('')
    : `
        <tr>
          <td colspan="2" style="padding: 12px; color: #64748b; font-size: 13.5px; font-style: italic;">
            Kiểm tra và bảo dưỡng tổng quát theo quy chuẩn của trung tâm.
          </td>
        </tr>
      `;

  const content = `
    <!-- GREETING -->
    <h2 style="margin: 0 0 14px 0; color: #0f172a; font-size: 18px; font-weight: 700;">
      Kính chào Quý khách ${details.customerName},
    </h2>
    <p style="margin: 0 0 24px 0; color: #475569; font-size: 14.5px; line-height: 1.6;">
      Lịch hẹn dịch vụ của Quý khách đã được Cố vấn dịch vụ tiếp nhận khoang xưởng và <strong style="color: #059669;">xác nhận thành công</strong>. Chúng tôi đã bố trí sẵn sàng đội ngũ kỹ thuật viên và vật tư để phục vụ phương tiện của Quý khách chu đáo nhất.
    </p>

    <!-- KEY HIGHLIGHT CARD -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
      <tr>
        <td style="padding: 20px;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" valign="top" style="padding-right: 12px; border-right: 1px solid #dcfce7;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #059669; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">GIỜ & NGÀY TIẾP NHẬN</p>
                <p style="margin: 0; font-size: 20px; color: #047857; font-weight: 800;">
                  ${details.scheduledTime}
                </p>
                <p style="margin: 2px 0 0 0; font-size: 14.5px; color: #1e293b; font-weight: 700;">
                  Ngày ${details.scheduledDate}
                </p>
                <span style="display: inline-block; margin-top: 6px; font-size: 11px; background-color: #d1fae5; color: #065f46; font-weight: 700; padding: 2px 8px; border-radius: 4px;">
                  Khoang ưu tiên sẵn sàng
                </span>
              </td>
              <td width="50%" valign="top" style="padding-left: 20px;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">THÔNG TIN PHƯƠNG TIỆN</p>
                <div style="margin: 0;">
                  ${details.licensePlate ? `
                    <span style="display: inline-block; background-color: #ffffff; color: #0f172a; font-weight: 800; font-size: 15px; padding: 3px 10px; border-radius: 6px; border: 1.5px solid #059669; font-family: monospace; letter-spacing: 0.5px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                      ${details.licensePlate}
                    </span>
                  ` : '<span style="color: #64748b;">Chưa có biển số</span>'}
                </div>
                ${details.vehicleModel ? `
                  <p style="margin: 6px 0 0 0; font-size: 13.5px; color: #334155; font-weight: 600;">
                    ${details.vehicleModel}
                  </p>
                ` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- SERVICES REQUESTED -->
    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
        HẠNG MỤC DỊCH VỤ DỰ KIẾN:
      </h3>
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
        ${servicesListHtml}
      </table>
    </div>

    ${details.notes ? `
    <!-- NOTES -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase;">Ghi chú yêu cầu của khách hàng:</p>
      <p style="margin: 0; font-size: 13.5px; color: #334155; line-height: 1.5; white-space: pre-line;">${details.notes}</p>
    </div>
    ` : ''}

    <!-- SERVICE ADVANTAGES & TIPS -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-left: 4px solid #059669; border-radius: 0 8px 8px 0; margin-bottom: 16px;">
      <tr>
        <td style="padding: 16px 20px;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #065f46; font-weight: 700;">
            Quy trình tiếp nhận xe nhanh chóng:
          </p>
          <ul style="margin: 0; padding-left: 18px; color: #166534; font-size: 13px; line-height: 1.6;">
            <li>Khi đến xưởng, Quý khách chỉ cần cung cấp <strong>Biển số xe</strong> hoặc <strong>Số điện thoại</strong> tại quầy Lễ tân.</li>
            <li>Quý khách được phục vụ trà, cà phê và nước suối miễn phí tại phòng chờ VIP có Wi-Fi tốc độ cao.</li>
            <li>Theo dõi trực tuyến từng bước tiến độ bảo dưỡng trên trang cá nhân theo thời gian thực.</li>
          </ul>
        </td>
      </tr>
    </table>
  `;

  return buildEmailLayout('Xác nhận lịch hẹn dịch vụ thành công', 'ĐÃ XÁC NHẬN', '#059669', '#ffffff', content);
}

/**
 * 5. Template: Nhắc nhở lịch hẹn sắp tới (Chạy bởi Job định kỳ)
 */
export function renderAppointmentReminderTemplate(details: EmailAppointmentDetails): string {
  const content = `
    <!-- GREETING -->
    <h2 style="margin: 0 0 14px 0; color: #0f172a; font-size: 18px; font-weight: 700;">
      Kính chào Quý khách ${details.customerName},
    </h2>
    <p style="margin: 0 0 24px 0; color: #475569; font-size: 14.5px; line-height: 1.6;">
      Trung tâm <strong>Car Service Center</strong> xin gửi thông báo nhắc nhở: Quý khách có một lịch hẹn bảo dưỡng ô tô diễn ra vào <strong style="color: #d97706;">ngày mai</strong>.
    </p>

    <!-- KEY REMINDER CARD -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border: 1.5px solid #fde68a; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
      <tr>
        <td style="padding: 20px;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" valign="top" style="padding-right: 12px; border-right: 1px solid #fef3c7;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #b45309; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">GIỜ & NGÀY HẸN</p>
                <p style="margin: 0; font-size: 20px; color: #d97706; font-weight: 800;">
                  ${details.scheduledTime}
                </p>
                <p style="margin: 2px 0 0 0; font-size: 14.5px; color: #1e293b; font-weight: 700;">
                  Ngày ${details.scheduledDate}
                </p>
              </td>
              <td width="50%" valign="top" style="padding-left: 20px;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">PHƯƠNG TIỆN</p>
                <div style="margin: 0;">
                  ${details.licensePlate ? `
                    <span style="display: inline-block; background-color: #ffffff; color: #0f172a; font-weight: 800; font-size: 15px; padding: 3px 10px; border-radius: 6px; border: 1.5px solid #d97706; font-family: monospace;">
                      ${details.licensePlate}
                    </span>
                  ` : ''}
                </div>
                ${details.vehicleModel ? `
                  <p style="margin: 6px 0 0 0; font-size: 13.5px; color: #334155; font-weight: 600;">
                    ${details.vehicleModel}
                  </p>
                ` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-left: 4px solid #0050cd; border-radius: 0 8px 8px 0; margin-bottom: 16px;">
      <tr>
        <td style="padding: 14px 18px;">
          <p style="margin: 0; font-size: 13.5px; color: #1e40af; line-height: 1.5;">
            Quý khách vui lòng đến trước <strong>10 - 15 phút</strong> để việc tiếp nhận diễn ra thuận lợi nhất. Nếu cần dời lại lịch hẹn, Quý khách có thể thao tác trực tiếp trên website hoặc gọi hotline <strong>1900 6868</strong>.
          </p>
        </td>
      </tr>
    </table>
  `;

  return buildEmailLayout('Nhắc nhở lịch hẹn bảo dưỡng ô tô', 'NHẮC HẸN NGÀY MAI', '#d97706', '#ffffff', content);
}
