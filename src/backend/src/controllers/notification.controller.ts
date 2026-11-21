import { Request, Response } from 'express';
import { NotificationType } from '@prisma/client';
import { notificationService } from '../services/notification.service';

function sendSuccess<T>(
  res: Response,
  data: T,
  message: string,
  meta?: { page: number; limit: number; total: number; totalPages: number },
  code = 200
): void {
  res.status(code).json({
    success: true,
    code,
    message,
    data,
    ...(meta ? { meta } : {}),
    timestamp: new Date().toISOString(),
  });
}

function sendError(
  res: Response,
  code: number,
  errorCode: string,
  message: string,
  details?: unknown
): void {
  res.status(code).json({
    success: false,
    code,
    message,
    error: {
      code: errorCode,
      ...(details !== undefined ? { details } : {}),
    },
    timestamp: new Date().toISOString(),
  });
}

function parsePositiveInt(value: unknown): number | null {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) return null;
  return num;
}

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, 'UNAUTHORIZED', 'Chưa xác thực người dùng');
      return;
    }

    const page = req.query.page ? parsePositiveInt(req.query.page) ?? 1 : 1;
    const limit = req.query.limit ? parsePositiveInt(req.query.limit) ?? 20 : 20;
    const unreadOnly = req.query.unreadOnly === 'true' || req.query.unreadOnly === '1';
    const since = typeof req.query.since === 'string' ? req.query.since : undefined;

    if (since && isNaN(new Date(since).getTime())) {
      sendError(res, 400, 'INVALID_QUERY_PARAM', 'Tham số since không hợp lệ');
      return;
    }

    let types: NotificationType[] | undefined;
    if (typeof req.query.types === 'string' && req.query.types.trim().length > 0) {
      const validTypes = new Set<string>(Object.values(NotificationType));
      const parsedTypes = req.query.types
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const invalidTypes = parsedTypes.filter((t) => !validTypes.has(t));
      if (invalidTypes.length > 0) {
        sendError(
          res,
          400,
          'INVALID_QUERY_PARAM',
          `Loại thông báo không hợp lệ: ${invalidTypes.join(', ')}`
        );
        return;
      }

      if (parsedTypes.length > 0) {
        types = parsedTypes as NotificationType[];
      }
    }

    const rawSearch = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const search = rawSearch.length > 0 ? rawSearch : undefined;

    const result = await notificationService.getUserNotifications(userId, {
      page,
      limit,
      unreadOnly,
      since,
      types,
      search,
    });

    sendSuccess(res, result.items, 'Lấy danh sách thông báo thành công', result.meta);
  } catch (error) {
    console.error('[NotificationController] getNotifications error:', error);
    sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Lỗi khi lấy danh sách thông báo');
  }
};

export const getNotificationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, 'UNAUTHORIZED', 'Chưa xác thực người dùng');
      return;
    }

    const id = parsePositiveInt(req.params.id);
    if (!id) {
      sendError(res, 400, 'INVALID_NOTIFICATION_ID', 'Mã thông báo không hợp lệ');
      return;
    }

    const notification = await notificationService.getByIdForUser(id, userId);
    if (!notification) {
      sendError(res, 404, 'NOTIFICATION_NOT_FOUND', 'Không tìm thấy thông báo');
      return;
    }

    sendSuccess(res, notification, 'Lấy chi tiết thông báo thành công');
  } catch (error) {
    console.error('[NotificationController] getNotificationById error:', error);
    sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Lỗi khi lấy chi tiết thông báo');
  }
};

export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, 'UNAUTHORIZED', 'Chưa xác thực người dùng');
      return;
    }

    const count = await notificationService.getUnreadCount(userId);
    sendSuccess(res, { count }, 'Lấy số lượng thông báo chưa đọc thành công');
  } catch (error) {
    console.error('[NotificationController] getUnreadCount error:', error);
    sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Lỗi khi lấy số lượng thông báo chưa đọc');
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, 'UNAUTHORIZED', 'Chưa xác thực người dùng');
      return;
    }

    const id = parsePositiveInt(req.params.id);
    if (!id) {
      sendError(res, 400, 'INVALID_NOTIFICATION_ID', 'Mã thông báo không hợp lệ');
      return;
    }

    const updated = await notificationService.markAsRead(id, userId);
    if (!updated) {
      sendError(res, 404, 'NOTIFICATION_NOT_FOUND', 'Không tìm thấy thông báo');
      return;
    }

    sendSuccess(res, updated, 'Đã đánh dấu thông báo đã đọc');
  } catch (error) {
    console.error('[NotificationController] markAsRead error:', error);
    sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Lỗi khi cập nhật trạng thái thông báo');
  }
};

export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, 'UNAUTHORIZED', 'Chưa xác thực người dùng');
      return;
    }

    const result = await notificationService.markAllAsRead(userId);
    sendSuccess(res, { updatedCount: result.count }, 'Đã đánh dấu tất cả thông báo đã đọc');
  } catch (error) {
    console.error('[NotificationController] markAllAsRead error:', error);
    sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Lỗi khi cập nhật tất cả thông báo');
  }
};

export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, 'UNAUTHORIZED', 'Chưa xác thực người dùng');
      return;
    }

    const id = parsePositiveInt(req.params.id);
    if (!id) {
      sendError(res, 400, 'INVALID_NOTIFICATION_ID', 'Mã thông báo không hợp lệ');
      return;
    }

    const deleted = await notificationService.deleteNotification(id, userId);
    if (!deleted) {
      sendError(res, 404, 'NOTIFICATION_NOT_FOUND', 'Không tìm thấy thông báo');
      return;
    }

    sendSuccess(res, { id }, 'Đã xóa thông báo thành công');
  } catch (error) {
    console.error('[NotificationController] deleteNotification error:', error);
    sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Lỗi khi xóa thông báo');
  }
};
