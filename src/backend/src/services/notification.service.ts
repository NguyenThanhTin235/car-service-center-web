import * as nodemailer from 'nodemailer';

class NotificationService {
  private transporter: nodemailer.Transporter | null = null;
  private testAccount: nodemailer.TestAccount | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      const emailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
      const emailPass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS;
      const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
      const emailPort = Number(process.env.EMAIL_PORT) || 587;

      if (emailUser && emailPass) {
        // Gửi email thật qua Gmail / SMTP cấu hình trong .env
        this.transporter = nodemailer.createTransport({
          host: emailHost,
          port: emailPort,
          secure: emailPort === 465, // true cho port 465, false cho 587
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });
        console.log(`📬 Notification Service initialized with REAL SMTP (${emailUser}).`);
      } else {
        // Fallback test với Ethereal Email giả lập
        this.testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: this.testAccount.user,
            pass: this.testAccount.pass,
          },
        });
        console.log('📬 Notification Service initialized with Ethereal Email (Mock).');
        console.log(`Login: ${this.testAccount.user} / Pass: ${this.testAccount.pass}`);
      }
    } catch (err) {
      console.error('Failed to initialize Notification Service:', err);
    }
  }

  async sendEmail(to: string, subject: string, html: string) {
    if (!this.transporter) {
      console.warn('Transporter not initialized yet.');
      return;
    }

    try {
      const fromEmail = process.env.GMAIL_USER || process.env.EMAIL_USER || 'noreply@carservice.com';
      const info = await this.transporter.sendMail({
        from: `"Car Service Center" <${fromEmail}>`, // sender address khớp tài khoản SMTP
        to, // list of receivers
        subject, // Subject line
        html, // html body
      });

      console.log('✉️ Email sent: %s', info.messageId);
      console.log('🔗 Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (err) {
      console.error('Error sending email:', err);
    }
  }
}

export const notificationService = new NotificationService();
