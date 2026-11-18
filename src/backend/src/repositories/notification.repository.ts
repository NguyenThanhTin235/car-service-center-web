import { Notification, NotificationType, Prisma } from '@prisma/client';
import prisma from '../utils/prisma';

export interface CreateNotificationInput {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: number | null;
}

export interface FindByUserOptions {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  since?: Date | string;
}

export interface PaginatedNotifications {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const notificationRepository = {
  async create(data: CreateNotificationInput): Promise<Notification> {
    return prisma.notification.create({
      data: {
        user_id: data.userId,
        notification_type: data.type,
        title: data.title,
        message: data.message,
        entity_type: data.entityType ?? null,
        entity_id: data.entityId ?? null,
      },
    });
  },

  async createMany(items: CreateNotificationInput[]): Promise<{ count: number }> {
    if (items.length === 0) return { count: 0 };
    return prisma.notification.createMany({
      data: items.map((item) => ({
        user_id: item.userId,
        notification_type: item.type,
        title: item.title,
        message: item.message,
        entity_type: item.entityType ?? null,
        entity_id: item.entityId ?? null,
      })),
    });
  },

  async findByUser(
    userId: number,
    options: FindByUserOptions = {}
  ): Promise<PaginatedNotifications> {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));

    const where: Prisma.NotificationWhereInput = {
      user_id: userId,
    };

    if (options.unreadOnly) {
      where.is_read = false;
    }

    if (options.since) {
      const sinceDate = options.since instanceof Date ? options.since : new Date(options.since);
      if (!isNaN(sinceDate.getTime())) {
        where.created_at = { gt: sinceDate };
      }
    }

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async countUnread(userId: number): Promise<number> {
    return prisma.notification.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });
  },

  async markAsRead(id: number, userId: number): Promise<Notification | null> {
    const existing = await prisma.notification.findFirst({
      where: { id, user_id: userId },
    });
    if (!existing) return null;
    if (existing.is_read) return existing;

    return prisma.notification.update({
      where: { id },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  },

  async markAllAsRead(userId: number): Promise<{ count: number }> {
    return prisma.notification.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  },

  async deleteById(id: number, userId: number): Promise<{ count: number }> {
    return prisma.notification.deleteMany({
      where: {
        id,
        user_id: userId,
      },
    });
  },
};
