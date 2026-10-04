import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || process.env.EMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS,
  },
});

export const sendOtpEmail = async (to: string, otp: string, purpose: 'register' | 'reset'): Promise<void> => {
  const isRegister = purpose === 'register';

  const subject = isRegister
    ? '[AutoCare Pro] Xác thực tài khoản của bạn'
    : '[AutoCare Pro] Mã đặt lại mật khẩu';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 20px;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        <!-- Header -->
        <tr>
          <td style="background-color: #0050cd; padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">AutoCare Pro</h1>
            <p style="color: #b3c5ff; margin: 8px 0 0; font-size: 14px; font-weight: 500;">Hệ thống Dịch vụ Ô tô Thông minh</p>
          </td>
        </tr>
        
        <!-- Content -->
        <tr>
          <td style="padding: 40px 32px;">
            <h2 style="font-size: 20px; color: #111827; font-weight: 700; margin: 0 0 16px;">
              ${isRegister ? 'Xác thực tài khoản của bạn' : 'Đặt lại mật khẩu'}
            </h2>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
              ${isRegister
                ? 'Chào mừng bạn đến với <strong>AutoCare Pro</strong>! Cảm ơn bạn đã đăng ký. Vui lòng sử dụng mã xác thực (OTP) bên dưới để hoàn tất quá trình đăng ký tài khoản của bạn.'
                : 'Chúng tôi vừa nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã xác thực (OTP) bên dưới để tiếp tục thiết lập mật khẩu mới.'}
            </p>
            
            <!-- OTP Box -->
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
              <p style="color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 16px;">Mã xác thực của bạn là</p>
              <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
                ${otp.split('').map(d => `<span style="display: inline-block; width: 44px; height: 52px; line-height: 52px; background: #ffffff; border: 1.5px solid #0050cd; border-radius: 8px; margin: 0 4px; font-size: 28px; font-weight: 700; color: #0050cd; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">${d}</span>`).join('')}
              </div>
            </div>
            
            <!-- Warnings -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              <tr>
                <td valign="top" style="padding-right: 12px; font-size: 16px;">⏱️</td>
                <td style="padding-bottom: 12px;">Mã này có hiệu lực trong <strong>5 phút</strong> kể từ khi email này được gửi.</td>
              </tr>
              <tr>
                <td valign="top" style="padding-right: 12px; font-size: 16px;">🔒</td>
                <td style="padding-bottom: 12px;">Tuyệt đối <strong>không chia sẻ</strong> mã này với bất kỳ ai, kể cả nhân viên AutoCare Pro để bảo đảm an toàn.</td>
              </tr>
              <tr>
                <td valign="top" style="padding-right: 12px; font-size: 16px;">⚠️</td>
                <td>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email và kiểm tra lại bảo mật tài khoản.</td>
              </tr>
            </table>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="background-color: #f3f4f6; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.5;">
              Email này được gửi tự động từ hệ thống AutoCare Pro.<br>
              Vui lòng không trả lời email này.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 12px 0 0;">
              &copy; 2025 AutoCare Pro Service Center. Bản quyền được bảo lưu.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"AutoCare Pro" <${process.env.GMAIL_USER || process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};
