import * as nodemailer from 'nodemailer';
import logger from '../loggers/logger';
import { sendSesEmail } from './aws-ses.service';
import { Notification, NotificationType } from '@prisma/client';
import prisma from '../utils/prisma';
import { emitToUser } from '../socket';
import {
  CreateNotificationInput,
  FindByUserOptions,
  notificationRepository,
} from '../repositories/notification.repository';

export interface NotificationDto {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  entityType: string | null;
  entityId: number | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface SendInAppPayload {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: number | null;
}

export type RoleNotificationPayload = Omit<SendInAppPayload, 'userId'>;

export interface NotifyAndEmailParams extends SendInAppPayload {
  email?: string;
  subject?: string;
  html?: string;
}

export function toNotificationDto(record: Notification): NotificationDto {
  return {
    id: record.id,
    userId: record.user_id,
    type: record.notification_type,
    title: record.title,
    message: record.message,
    entityType: record.entity_type,
    entityId: record.entity_id,
    isRead: record.is_read,
    readAt: record.read_at,
    createdAt: record.created_at,
  };
}

class NotificationService {
  private transporter: nodemailer.Transporter | null = null;
  private testAccount: nodemailer.TestAccount | null = null;

  constructor() {
    if (process.env.EMAIL_PROVIDER !== 'ses') {
      this.init();
    }
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
      } else if (process.env.NODE_ENV !== 'test') {
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
    if (process.env.EMAIL_PROVIDER === 'ses') {
      try {
        await sendSesEmail({ to, subject, html });
      } catch (err) {
        logger.error('Error sending email via SES', { error: (err as Error).message });
      }
      return;
    }

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

  async sendInApp(payload: SendInAppPayload): Promise<NotificationDto> {
    const created = await notificationRepository.create({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      entityType: payload.entityType,
      entityId: payload.entityId,
    });

    const dto = toNotificationDto(created);
    const unreadCount = await notificationRepository.countUnread(payload.userId);

    emitToUser(payload.userId, 'notification:new', dto);
    emitToUser(payload.userId, 'notification:unread_count', { count: unreadCount });

    return dto;
  }

  async sendInAppToRoles(
    roles: string[],
    payload: RoleNotificationPayload
  ): Promise<{ count: number; userIds: number[] }> {
    if (roles.length === 0) return { count: 0, userIds: [] };

    const users = await prisma.user.findMany({
      where: {
        is_active: true,
        roles: {
          some: {
            role: {
              name: { in: roles },
            },
          },
        },
      },
      select: { id: true },
    });

    const userIds = Array.from(new Set(users.map((u) => u.id)));
    if (userIds.length === 0) return { count: 0, userIds: [] };

    const items: CreateNotificationInput[] = userIds.map((userId) => ({
      userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      entityType: payload.entityType,
      entityId: payload.entityId,
    }));

    const result = await notificationRepository.createMany(items);

    await Promise.all(
      userIds.map(async (userId) => {
        const [latest] = (
          await notificationRepository.findByUser(userId, { page: 1, limit: 1 })
        ).items;
        const unreadCount = await notificationRepository.countUnread(userId);

        if (latest) {
          emitToUser(userId, 'notification:new', toNotificationDto(latest));
        }
        emitToUser(userId, 'notification:unread_count', { count: unreadCount });
      })
    );

    return { count: result.count, userIds };
  }

  async notifyAndEmail(params: NotifyAndEmailParams): Promise<NotificationDto> {
    const inAppPromise = this.sendInApp({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      entityType: params.entityType,
      entityId: params.entityId,
    });

    const emailPromise =
      params.email && params.subject && params.html
        ? this.sendEmail(params.email, params.subject, params.html).catch((err) => {
            console.error('[NotificationService] Email delivery failed:', err);
          })
        : Promise.resolve();

    const [notification] = await Promise.all([inAppPromise, emailPromise]);
    return notification;
  }

  async getUserNotifications(userId: number, options: FindByUserOptions = {}) {
    const result = await notificationRepository.findByUser(userId, options);
    return {
      items: result.items.map(toNotificationDto),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  async getByIdForUser(id: number, userId: number): Promise<NotificationDto | null> {
    const record = await notificationRepository.findByIdForUser(id, userId);
    return record ? toNotificationDto(record) : null;
  }

  async getUnreadCount(userId: number): Promise<number> {
    return notificationRepository.countUnread(userId);
  }

  async markAsRead(id: number, userId: number): Promise<NotificationDto | null> {
    const updated = await notificationRepository.markAsRead(id, userId);
    if (!updated) return null;

    const dto = toNotificationDto(updated);
    const unreadCount = await notificationRepository.countUnread(userId);

    emitToUser(userId, 'notification:read', { id: dto.id, readAt: dto.readAt });
    emitToUser(userId, 'notification:unread_count', { count: unreadCount });

    return dto;
  }

  async markAllAsRead(userId: number): Promise<{ count: number }> {
    const result = await notificationRepository.markAllAsRead(userId);

    emitToUser(userId, 'notification:read', { all: true, readAt: new Date() });
    emitToUser(userId, 'notification:unread_count', { count: 0 });

    return result;
  }

  async deleteNotification(id: number, userId: number): Promise<boolean> {
    const result = await notificationRepository.deleteById(id, userId);
    if (result.count === 0) return false;

    const unreadCount = await notificationRepository.countUnread(userId);
    emitToUser(userId, 'notification:unread_count', { count: unreadCount });

    return true;
  }
}

export const notificationService = new NotificationService();
