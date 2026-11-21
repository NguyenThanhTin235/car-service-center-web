'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '@/store';
import { NotificationItem } from '@/lib/api/notification.api';
import {
  fetchNotifications,
  fetchUnreadCount,
  prependRealtimeNotification,
  setSocketConnected,
  setUnreadCount,
  syncReadFromSocket,
} from '@/store/slices/notificationSlice';

function getSocketBaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  return rawUrl.replace(/\/api\/?$/, '');
}

export function useNotificationSocket() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, token: storeToken } = useAppSelector((state) => state.auth);
  const items = useAppSelector((state) => state.notifications.items);
  const latestCreatedAtRef = useRef<string | undefined>(undefined);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    latestCreatedAtRef.current = items[0]?.createdAt;
  }, [items]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      dispatch(setSocketConnected(false));
      return;
    }

    const token =
      storeToken || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    const socket = io(getSocketBaseUrl(), {
      withCredentials: true,
      extraHeaders: {
        'x-portal': 'customer',
      },
      auth: {
        portal: 'customer',
        ...(token ? { token } : {}),
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    const handleConnectOrReconnect = () => {
      dispatch(setSocketConnected(true));
      dispatch(fetchUnreadCount());

      if (latestCreatedAtRef.current) {
        dispatch(
          fetchNotifications({
            page: 1,
            limit: 10,
            since: latestCreatedAtRef.current,
          })
        );
      } else {
        dispatch(fetchNotifications({ page: 1, limit: 10 }));
      }
    };

    socket.on('connect', handleConnectOrReconnect);
    socket.on('disconnect', () => {
      dispatch(setSocketConnected(false));
    });
    socket.on('connect_error', () => {
      dispatch(setSocketConnected(false));
    });

    socket.on('notification:new', (payload: NotificationItem) => {
      if (payload && typeof payload.id === 'number') {
        dispatch(prependRealtimeNotification(payload));
      }
    });

    socket.on('notification:unread_count', (payload: { count?: number }) => {
      if (typeof payload?.count === 'number') {
        dispatch(setUnreadCount(payload.count));
      }
    });

    socket.on(
      'notification:read',
      (payload: { id?: number; all?: boolean; readAt?: string | null }) => {
        if (payload) {
          dispatch(syncReadFromSocket(payload));
        }
      }
    );

    return () => {
      socket.off('connect', handleConnectOrReconnect);
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('notification:new');
      socket.off('notification:unread_count');
      socket.off('notification:read');
      socket.disconnect();
      socketRef.current = null;
      dispatch(setSocketConnected(false));
    };
  }, [dispatch, isAuthenticated, user, storeToken]);
}
