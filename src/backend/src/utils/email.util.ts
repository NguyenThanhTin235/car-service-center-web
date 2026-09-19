import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendOtpEmail = async (to: string, otp: string, purpose: 'register' | 'reset'): Promise<void> => {
  const isRegister = purpose === 'register';

  const subject = isRegister
    ? '[AutoCare Pro] Xác thực tài khoản của bạn'
    : '[AutoCare Pro] Mã đặt lại mật khẩu';

  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e4e6eb;">
      <div style="background: #0866FF; padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 700;">AutoCare Pro</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 14px;">Hệ thống Dịch vụ Ô tô Thông minh</p>
      </div>
      <div style="padding: 32px 24px;">
        <h2 style="font-size: 18px; color: #050505; font-weight: 700; margin: 0 0 8px;">
          ${isRegister ? 'Xác thực tài khoản' : 'Đặt lại mật khẩu'}
        </h2>
        <p style="color: #65676b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          ${isRegister
            ? 'Chào mừng bạn đến với AutoCare Pro! Vui lòng nhập mã OTP bên dưới để xác thực tài khoản của bạn.'
            : 'Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhập mã OTP bên dưới để tiếp tục.'}
        </p>
        <div style="background: #f0f2f5; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #65676b; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Mã xác thực (OTP)</p>
          <div style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #0866FF; font-family: monospace;">${otp}</div>
        </div>
        <p style="color: #65676b; font-size: 13px; margin: 0; line-height: 1.6;">
          ⏰ Mã có hiệu lực trong <strong>5 phút</strong>.<br>
          🔒 Không chia sẻ mã này với bất kỳ ai, kể cả nhân viên AutoCare Pro.<br>
          ❌ Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.
        </p>
      </div>
      <div style="background: #f0f2f5; padding: 16px 24px; text-align: center;">
        <p style="color: #65676b; font-size: 12px; margin: 0;">© 2025 AutoCare Pro Service Center. Bản quyền được bảo lưu.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"AutoCare Pro" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
};
