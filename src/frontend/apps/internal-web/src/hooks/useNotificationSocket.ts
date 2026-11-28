'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/store';
import { NotificationItem } from '@/lib/api/notification.api';
import {
  applyNotificationRead,
  fetchNotifications,
  fetchUnreadCount,
  receiveNewNotification,
  setSocketConnected,
  setUnreadCount,
  syncNotificationsSince,
} from '@/store/slices/notificationSlice';

let sharedSocket: Socket | null = null;
let subscriberCount = 0;

function getSocketBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  return raw.replace(/\/api\/?$/, '');
}

export function useNotificationSocket(): void {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const lastSyncedAt = useAppSelector((state) => state.notifications.lastSyncedAt);
  const lastSyncedAtRef = useRef<string | null>(lastSyncedAt);

  useEffect(() => {
    lastSyncedAtRef.current = lastSyncedAt;
  }, [lastSyncedAt]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      if (sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
        dispatch(setSocketConnected(false));
      }
      return;
    }

    subscriberCount += 1;

    if (!sharedSocket) {
      const token =
        typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;

      const socket = io(getSocketBaseUrl(), {
        withCredentials: true,
        extraHeaders: {
          'x-portal': 'internal',
        },
        auth: {
          portal: 'internal',
          ...(token ? { token } : {}),
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1500,
      });

      sharedSocket = socket;

      socket.on('connect', () => {
        dispatch(setSocketConnected(true));
        dispatch(fetchUnreadCount());

        if (lastSyncedAtRef.current) {
          dispatch(syncNotificationsSince(lastSyncedAtRef.current));
        } else {
          dispatch(fetchNotifications({ page: 1, limit: 20 }));
        }
      });

      socket.on('disconnect', () => {
        dispatch(setSocketConnected(false));
      });

      socket.on('connect_error', () => {
        dispatch(setSocketConnected(false));
      });

      socket.on('notification:new', (payload: NotificationItem) => {
        dispatch(receiveNewNotification(payload));
        // Tránh chồng toast khi Admin tự thao tác khóa/mở khóa tài khoản trên trang Quản lý tài khoản
        if (payload.entityType?.toUpperCase() !== 'USER') {
          toast(payload.title || 'Bạn có thông báo mới', {
            duration: 4000,
          });
        }
      });

      socket.on('notification:unread_count', (payload: { count: number }) => {
        if (typeof payload?.count === 'number') {
          dispatch(setUnreadCount(payload.count));
        }
      });

      socket.on(
        'notification:read',
        (payload: { id?: number; all?: boolean; readAt?: string }) => {
          dispatch(applyNotificationRead(payload));
        }
      );
    }

    return () => {
      subscriberCount = Math.max(0, subscriberCount - 1);
      if (subscriberCount === 0 && sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
        dispatch(setSocketConnected(false));
      }
    };
  }, [dispatch, isAuthenticated, user?.id]);
}
