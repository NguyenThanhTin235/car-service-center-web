import * as nodemailer from 'nodemailer';

class NotificationService {
  private transporter: nodemailer.Transporter | null = null;
  private testAccount: nodemailer.TestAccount | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      // Use Ethereal Email for testing
      this.testAccount = await nodemailer.createTestAccount();

      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: this.testAccount.user, // generated ethereal user
          pass: this.testAccount.pass, // generated ethereal password
        },
      });

      console.log('📬 Notification Service initialized with Ethereal Email.');
      console.log(`Login: ${this.testAccount.user} / Pass: ${this.testAccount.pass}`);
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
      const info = await this.transporter.sendMail({
        from: '"Car Service Center" <noreply@carservice.com>', // sender address
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
