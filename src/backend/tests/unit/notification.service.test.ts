import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationType } from '@prisma/client';

vi.mock('../../src/repositories/notification.repository', () => ({
  notificationRepository: {
    create: vi.fn(),
    createMany: vi.fn(),
    findByUser: vi.fn(),
    findByIdForUser: vi.fn(),
    countUnread: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteById: vi.fn(),
  },
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
      findMany: vi.fn(),
    },
  },
}));

import { notificationService } from '../../src/services/notification.service';
import { notificationRepository } from '../../src/repositories/notification.repository';
import { emitToUser } from '../../src/socket';
import prisma from '../../src/utils/prisma';

describe('Unit - NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendInApp', () => {
    it('persists notification via repository and emits notification:new & notification:unread_count to user:${userId}', async () => {
      const now = new Date('2026-11-18T10:00:00.000Z');
      const createdRecord = {
        id: 42,
        user_id: 101,
        notification_type: NotificationType.APPOINTMENT_CONFIRMED,
        title: 'Lịch hẹn đã xác nhận',
        message: 'Lịch hẹn #12 của bạn đã được xác nhận.',
        entity_type: 'APPOINTMENT',
        entity_id: 12,
        is_read: false,
        read_at: null,
        created_at: now,
      };

      vi.mocked(notificationRepository.create).mockResolvedValue(createdRecord);
      vi.mocked(notificationRepository.countUnread).mockResolvedValue(3);

      const dto = await notificationService.sendInApp({
        userId: 101,
        type: NotificationType.APPOINTMENT_CONFIRMED,
        title: 'Lịch hẹn đã xác nhận',
        message: 'Lịch hẹn #12 của bạn đã được xác nhận.',
        entityType: 'APPOINTMENT',
        entityId: 12,
      });

      expect(notificationRepository.create).toHaveBeenCalledWith({
        userId: 101,
        type: NotificationType.APPOINTMENT_CONFIRMED,
        title: 'Lịch hẹn đã xác nhận',
        message: 'Lịch hẹn #12 của bạn đã được xác nhận.',
        entityType: 'APPOINTMENT',
        entityId: 12,
      });
      expect(notificationRepository.countUnread).toHaveBeenCalledWith(101);

      const expectedDto = {
        id: 42,
        userId: 101,
        type: NotificationType.APPOINTMENT_CONFIRMED,
        title: 'Lịch hẹn đã xác nhận',
        message: 'Lịch hẹn #12 của bạn đã được xác nhận.',
        entityType: 'APPOINTMENT',
        entityId: 12,
        isRead: false,
        readAt: null,
        createdAt: now,
      };

      expect(dto).toEqual(expectedDto);
      expect(emitToUser).toHaveBeenCalledWith(101, 'notification:new', expectedDto);
      expect(emitToUser).toHaveBeenCalledWith(101, 'notification:unread_count', { count: 3 });
    });
  });

  describe('notifyAndEmail', () => {
    it('still succeeds with In-App notification even when sendEmail / SMTP rejects (fault isolation)', async () => {
      const now = new Date('2026-11-18T10:05:00.000Z');
      const createdRecord = {
        id: 55,
        user_id: 101,
        notification_type: NotificationType.INVOICE_ISSUED,
        title: 'Hóa đơn mới',
        message: 'Hóa đơn #INV-55 đã được phát hành.',
        entity_type: 'INVOICE',
        entity_id: 55,
        is_read: false,
        read_at: null,
        created_at: now,
      };

      vi.mocked(notificationRepository.create).mockResolvedValue(createdRecord);
      vi.mocked(notificationRepository.countUnread).mockResolvedValue(1);

      const sendEmailSpy = vi
        .spyOn(notificationService, 'sendEmail')
        .mockRejectedValueOnce(new Error('SMTP connection timeout'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await notificationService.notifyAndEmail({
        userId: 101,
        type: NotificationType.INVOICE_ISSUED,
        title: 'Hóa đơn mới',
        message: 'Hóa đơn #INV-55 đã được phát hành.',
        entityType: 'INVOICE',
        entityId: 55,
        email: 'customer@example.com',
        subject: 'Hóa đơn dịch vụ #INV-55',
        html: '<p>Hóa đơn của bạn</p>',
      });

      expect(sendEmailSpy).toHaveBeenCalledWith(
        'customer@example.com',
        'Hóa đơn dịch vụ #INV-55',
        '<p>Hóa đơn của bạn</p>'
      );
      expect(result.id).toBe(55);
      expect(result.userId).toBe(101);
      expect(emitToUser).toHaveBeenCalledWith(101, 'notification:new', expect.objectContaining({ id: 55 }));
      expect(emitToUser).toHaveBeenCalledWith(101, 'notification:unread_count', { count: 1 });

      sendEmailSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('skips sendEmail when email/subject/html are not provided', async () => {
      const now = new Date('2026-11-18T10:10:00.000Z');
      vi.mocked(notificationRepository.create).mockResolvedValue({
        id: 56,
        user_id: 102,
        notification_type: NotificationType.VEHICLE_READY,
        title: 'Xe đã sẵn sàng',
        message: 'Xe của bạn đã hoàn tất bảo dưỡng.',
        entity_type: 'WORK_ORDER',
        entity_id: 88,
        is_read: false,
        read_at: null,
        created_at: now,
      });
      vi.mocked(notificationRepository.countUnread).mockResolvedValue(2);

      const sendEmailSpy = vi.spyOn(notificationService, 'sendEmail');

      const result = await notificationService.notifyAndEmail({
        userId: 102,
        type: NotificationType.VEHICLE_READY,
        title: 'Xe đã sẵn sàng',
        message: 'Xe của bạn đã hoàn tất bảo dưỡng.',
        entityType: 'WORK_ORDER',
        entityId: 88,
      });

      expect(sendEmailSpy).not.toHaveBeenCalled();
      expect(result.id).toBe(56);

      sendEmailSpy.mockRestore();
    });
  });

  describe('sendInAppToRoles', () => {
    it('queries active users for those roles, calls createMany, and emits to each user room', async () => {
      const now = new Date('2026-11-18T10:15:00.000Z');
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { id: 10 },
        { id: 20 },
        { id: 10 }, // duplicate user across multiple roles should be deduplicated
      ] as any);

      vi.mocked(notificationRepository.createMany).mockResolvedValue({ count: 2 });

      vi.mocked(notificationRepository.findByUser).mockImplementation(async (userId: number) => ({
        items: [
          {
            id: userId === 10 ? 201 : 202,
            user_id: userId,
            notification_type: NotificationType.QUOTATION_APPROVED,
            title: 'Báo giá được duyệt',
            message: 'Khách hàng đã duyệt báo giá #Q-99.',
            entity_type: 'QUOTATION',
            entity_id: 99,
            is_read: false,
            read_at: null,
            created_at: now,
          },
        ],
        total: 1,
        page: 1,
        limit: 1,
        totalPages: 1,
      }));

      vi.mocked(notificationRepository.countUnread).mockImplementation(async (userId: number) =>
        userId === 10 ? 4 : 1
      );

      const result = await notificationService.sendInAppToRoles(['SA', 'DESK STAFF'], {
        type: NotificationType.QUOTATION_APPROVED,
        title: 'Báo giá được duyệt',
        message: 'Khách hàng đã duyệt báo giá #Q-99.',
        entityType: 'QUOTATION',
        entityId: 99,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          is_active: true,
          roles: {
            some: {
              role: {
                name: { in: ['SA', 'DESK STAFF'] },
              },
            },
          },
        },
        select: { id: true },
      });

      expect(notificationRepository.createMany).toHaveBeenCalledWith([
        {
          userId: 10,
          type: NotificationType.QUOTATION_APPROVED,
          title: 'Báo giá được duyệt',
          message: 'Khách hàng đã duyệt báo giá #Q-99.',
          entityType: 'QUOTATION',
          entityId: 99,
        },
        {
          userId: 20,
          type: NotificationType.QUOTATION_APPROVED,
          title: 'Báo giá được duyệt',
          message: 'Khách hàng đã duyệt báo giá #Q-99.',
          entityType: 'QUOTATION',
          entityId: 99,
        },
      ]);

      expect(emitToUser).toHaveBeenCalledWith(
        10,
        'notification:new',
        expect.objectContaining({ id: 201, userId: 10 })
      );
      expect(emitToUser).toHaveBeenCalledWith(10, 'notification:unread_count', { count: 4 });

      expect(emitToUser).toHaveBeenCalledWith(
        20,
        'notification:new',
        expect.objectContaining({ id: 202, userId: 20 })
      );
      expect(emitToUser).toHaveBeenCalledWith(20, 'notification:unread_count', { count: 1 });

      expect(result).toEqual({ count: 2, userIds: [10, 20] });
    });

    it('returns { count: 0, userIds: [] } when roles array is empty or no active users match', async () => {
      const emptyRolesRes = await notificationService.sendInAppToRoles([], {
        type: NotificationType.CHECKIN_READY,
        title: 'Test',
        message: 'Test',
      });
      expect(emptyRolesRes).toEqual({ count: 0, userIds: [] });
      expect(prisma.user.findMany).not.toHaveBeenCalled();

      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      const noUsersRes = await notificationService.sendInAppToRoles(['ADMIN'], {
        type: NotificationType.CHECKIN_READY,
        title: 'Test',
        message: 'Test',
      });
      expect(noUsersRes).toEqual({ count: 0, userIds: [] });
      expect(notificationRepository.createMany).not.toHaveBeenCalled();
    });
  });

  describe('getUserNotifications (listForUser)', () => {
    it('forwards types and search filters to notificationRepository.findByUser and maps items to DTOs', async () => {
      const now = new Date('2026-11-18T11:00:00.000Z');
      vi.mocked(notificationRepository.findByUser).mockResolvedValue({
        items: [
          {
            id: 71,
            user_id: 101,
            notification_type: NotificationType.PAYMENT_SUCCESS,
            title: 'Thanh toán thành công',
            message: 'Test payment message',
            entity_type: 'PAYMENT',
            entity_id: 301,
            is_read: false,
            read_at: null,
            created_at: now,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const filters = {
        page: 1,
        limit: 10,
        types: [NotificationType.APPOINTMENT_CONFIRMED, NotificationType.PAYMENT_SUCCESS],
        search: 'test',
      };

      const result = await notificationService.getUserNotifications(101, filters);

      expect(notificationRepository.findByUser).toHaveBeenCalledWith(101, filters);
      expect(result).toEqual({
        items: [
          {
            id: 71,
            userId: 101,
            type: NotificationType.PAYMENT_SUCCESS,
            title: 'Thanh toán thành công',
            message: 'Test payment message',
            entityType: 'PAYMENT',
            entityId: 301,
            isRead: false,
            readAt: null,
            createdAt: now,
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });
  });

  describe('getByIdForUser', () => {
    it('returns mapped NotificationDto when notification is owned by user', async () => {
      const now = new Date('2026-11-18T11:15:00.000Z');
      vi.mocked(notificationRepository.findByIdForUser).mockResolvedValue({
        id: 88,
        user_id: 101,
        notification_type: NotificationType.APPOINTMENT_CONFIRMED,
        title: 'Lịch hẹn đã xác nhận',
        message: 'Lịch hẹn #88 đã được xác nhận.',
        entity_type: 'APPOINTMENT',
        entity_id: 88,
        is_read: true,
        read_at: now,
        created_at: now,
      });

      const dto = await notificationService.getByIdForUser(88, 101);

      expect(notificationRepository.findByIdForUser).toHaveBeenCalledWith(88, 101);
      expect(dto).toEqual({
        id: 88,
        userId: 101,
        type: NotificationType.APPOINTMENT_CONFIRMED,
        title: 'Lịch hẹn đã xác nhận',
        message: 'Lịch hẹn #88 đã được xác nhận.',
        entityType: 'APPOINTMENT',
        entityId: 88,
        isRead: true,
        readAt: now,
        createdAt: now,
      });
    });

    it('returns null when notification is not found or not owned by user', async () => {
      vi.mocked(notificationRepository.findByIdForUser).mockResolvedValue(null);

      const dto = await notificationService.getByIdForUser(999, 101);

      expect(notificationRepository.findByIdForUser).toHaveBeenCalledWith(999, 101);
      expect(dto).toBeNull();
    });
  });
});
