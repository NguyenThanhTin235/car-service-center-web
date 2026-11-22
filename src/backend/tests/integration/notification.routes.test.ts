import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { NotificationType } from '@prisma/client';
import app from '../../src/app';
import { generateToken } from '../../src/utils/jwt.util';
import prisma from '../../src/utils/prisma';

vi.mock('../../src/utils/redis.util', () => ({
  getCache: vi.fn().mockResolvedValue(null),
  setCache: vi.fn().mockResolvedValue(undefined),
  deleteCache: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/socket', () => ({
  emitToUser: vi.fn(),
  emitToRole: vi.fn(),
  getIO: vi.fn(),
}));

vi.mock('../../src/utils/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: vi.fn(),
    },
    notification: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('Integration API - Notification Routes (/api/notifications)', () => {
  const userAToken = generateToken({
    id: 101,
    email: 'usera@example.com',
    fullName: 'Nguyễn Văn A',
    roles: ['CUSTOMER'],
  });

  const userBToken = generateToken({
    id: 202,
    email: 'userb@example.com',
    fullName: 'Trần Thị B',
    roles: ['CUSTOMER'],
  });

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(prisma.user.findUnique).mockImplementation((({ where }: { where: { id: number } }) => {
      if (where.id === 101) {
        return Promise.resolve({
          id: 101,
          email: 'usera@example.com',
          full_name: 'Nguyễn Văn A',
          is_active: true,
          roles: [{ role: { name: 'CUSTOMER' } }],
        });
      }
      if (where.id === 202) {
        return Promise.resolve({
          id: 202,
          email: 'userb@example.com',
          full_name: 'Trần Thị B',
          is_active: true,
          roles: [{ role: { name: 'CUSTOMER' } }],
        });
      }
      return Promise.resolve(null);
    }) as any);
  });

  describe('Authentication', () => {
    it('returns 401 when request has no authentication token', async () => {
      const res = await request(app).get('/api/notifications');

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });

  describe('GET /api/notifications', () => {
    it('returns paginated notifications with standard API_CONVENTION envelope and supports unreadOnly filter', async () => {
      const createdAt = new Date('2026-11-18T09:00:00.000Z');
      vi.mocked(prisma.notification.findMany).mockResolvedValue([
        {
          id: 11,
          user_id: 101,
          notification_type: NotificationType.APPOINTMENT_CONFIRMED,
          title: 'Lịch hẹn đã xác nhận',
          message: 'Lịch hẹn của bạn đã được xác nhận.',
          entity_type: 'APPOINTMENT',
          entity_id: 5,
          is_read: false,
          read_at: null,
          created_at: createdAt,
        },
      ]);
      vi.mocked(prisma.notification.count).mockResolvedValue(6);

      const res = await request(app)
        .get('/api/notifications?page=2&limit=5&unreadOnly=true')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        code: 200,
        message: expect.any(String),
        data: [
          {
            id: 11,
            userId: 101,
            type: NotificationType.APPOINTMENT_CONFIRMED,
            title: 'Lịch hẹn đã xác nhận',
            message: 'Lịch hẹn của bạn đã được xác nhận.',
            entityType: 'APPOINTMENT',
            entityId: 5,
            isRead: false,
            readAt: null,
            createdAt: createdAt.toISOString(),
          },
        ],
        meta: {
          page: 2,
          limit: 5,
          total: 6,
          totalPages: 2,
        },
      });
      expect(typeof res.body.timestamp).toBe('string');

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: {
          user_id: 101,
          is_read: false,
        },
        orderBy: { created_at: 'desc' },
        skip: 5,
        take: 5,
      });
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: {
          user_id: 101,
          is_read: false,
        },
      });
    });

    it('supports types and search query filters', async () => {
      const createdAt = new Date('2026-11-18T10:30:00.000Z');
      vi.mocked(prisma.notification.findMany).mockResolvedValue([
        {
          id: 25,
          user_id: 101,
          notification_type: NotificationType.PAYMENT_SUCCESS,
          title: 'Thanh toán test',
          message: 'Giao dịch thành công.',
          entity_type: 'PAYMENT',
          entity_id: 50,
          is_read: false,
          read_at: null,
          created_at: createdAt,
        },
      ]);
      vi.mocked(prisma.notification.count).mockResolvedValue(1);

      const res = await request(app)
        .get('/api/notifications?types=APPOINTMENT_CONFIRMED,PAYMENT_SUCCESS&search=test')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        code: 200,
        data: [
          {
            id: 25,
            userId: 101,
            type: NotificationType.PAYMENT_SUCCESS,
            title: 'Thanh toán test',
            message: 'Giao dịch thành công.',
            entityType: 'PAYMENT',
            entityId: 50,
            isRead: false,
            readAt: null,
            createdAt: createdAt.toISOString(),
          },
        ],
        meta: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });

      const expectedWhere = {
        user_id: 101,
        notification_type: {
          in: [NotificationType.APPOINTMENT_CONFIRMED, NotificationType.PAYMENT_SUCCESS],
        },
        OR: [
          { title: { contains: 'test' } },
          { message: { contains: 'test' } },
        ],
      };

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: expectedWhere,
        orderBy: { created_at: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: expectedWhere,
      });
    });
  });

  describe('GET /api/notifications/:id', () => {
    it('returns 200 with notification DTO for owner', async () => {
      const createdAt = new Date('2026-11-18T11:00:00.000Z');
      vi.mocked(prisma.notification.findFirst).mockResolvedValue({
        id: 42,
        user_id: 101,
        notification_type: NotificationType.APPOINTMENT_CONFIRMED,
        title: 'Lịch hẹn đã xác nhận',
        message: 'Lịch hẹn #42 đã được xác nhận.',
        entity_type: 'APPOINTMENT',
        entity_id: 42,
        is_read: false,
        read_at: null,
        created_at: createdAt,
      });

      const res = await request(app)
        .get('/api/notifications/42')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        code: 200,
        data: {
          id: 42,
          userId: 101,
          type: NotificationType.APPOINTMENT_CONFIRMED,
          title: 'Lịch hẹn đã xác nhận',
          message: 'Lịch hẹn #42 đã được xác nhận.',
          entityType: 'APPOINTMENT',
          entityId: 42,
          isRead: false,
          readAt: null,
          createdAt: createdAt.toISOString(),
        },
      });
      expect(prisma.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 42, user_id: 101 },
      });
    });

    it('returns 404 when notification is owned by another user or non-existent', async () => {
      vi.mocked(prisma.notification.findFirst).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/notifications/999')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        success: false,
        code: 404,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
        },
      });
      expect(prisma.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 999, user_id: 101 },
      });
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('returns unread notification count for authenticated user', async () => {
      vi.mocked(prisma.notification.count).mockResolvedValue(4);

      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        code: 200,
        data: { count: 4 },
      });
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: {
          user_id: 101,
          is_read: false,
        },
      });
    });
  });

  describe('PATCH /api/notifications/:id/read & PATCH /api/notifications/read-all', () => {
    it('marks own notification as read and returns updated DTO', async () => {
      const createdAt = new Date('2026-11-18T08:00:00.000Z');
      const readAt = new Date('2026-11-18T09:30:00.000Z');

      vi.mocked(prisma.notification.findFirst).mockResolvedValue({
        id: 15,
        user_id: 101,
        notification_type: NotificationType.QUOTATION_SENT,
        title: 'Báo giá mới',
        message: 'Bạn có báo giá mới cần duyệt.',
        entity_type: 'QUOTATION',
        entity_id: 30,
        is_read: false,
        read_at: null,
        created_at: createdAt,
      });
      vi.mocked(prisma.notification.update).mockResolvedValue({
        id: 15,
        user_id: 101,
        notification_type: NotificationType.QUOTATION_SENT,
        title: 'Báo giá mới',
        message: 'Bạn có báo giá mới cần duyệt.',
        entity_type: 'QUOTATION',
        entity_id: 30,
        is_read: true,
        read_at: readAt,
        created_at: createdAt,
      });
      vi.mocked(prisma.notification.count).mockResolvedValue(2);

      const res = await request(app)
        .patch('/api/notifications/15/read')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        code: 200,
        data: {
          id: 15,
          userId: 101,
          isRead: true,
        },
      });
      expect(prisma.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 15, user_id: 101 },
      });
    });

    it('prevents User A from marking User B notification as read (returns 404)', async () => {
      vi.mocked(prisma.notification.findFirst).mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/notifications/999/read')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        success: false,
        code: 404,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
        },
      });
      expect(prisma.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 999, user_id: 101 },
      });
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });

    it('marks all unread notifications as read for authenticated user', async () => {
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 5 });

      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        code: 200,
        data: { updatedCount: 5 },
      });
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          user_id: 202,
          is_read: false,
        },
        data: {
          is_read: true,
          read_at: expect.any(Date),
        },
      });
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('deletes own notification and returns 200', async () => {
      vi.mocked(prisma.notification.deleteMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.notification.count).mockResolvedValue(1);

      const res = await request(app)
        .delete('/api/notifications/15')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        code: 200,
        data: { id: 15 },
      });
      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: { id: 15, user_id: 101 },
      });
    });

    it('prevents User A from deleting User B notification (returns 404)', async () => {
      vi.mocked(prisma.notification.deleteMany).mockResolvedValue({ count: 0 });

      const res = await request(app)
        .delete('/api/notifications/999')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        success: false,
        code: 404,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
        },
      });
      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: { id: 999, user_id: 101 },
      });
    });
  });
});
