'use client';

import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/store/slices/authSlice';
import api from '@/lib/axios';

export default function SessionWatcher() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const checkingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // 1. Lắng nghe tín hiệu thu hồi phiên tức thì giữa các tab cùng máy
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('csc_session_channel');
        channel.onmessage = (event) => {
          if (
            event.data?.type === 'ACCOUNT_DEACTIVATED' &&
            Number(event.data?.userId) === Number(user.id)
          ) {
            dispatch(logout());
            window.location.href = '/login?reason=account_locked';
          }
        };
      } catch {
        // BroadcastChannel unsupported fallback
      }
    }

    // 2. Nhịp tim kiểm tra phiên với máy chủ (Heartbeat mỗi 3 giây)
    const checkSession = async () => {
      if (checkingRef.current) return;
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/login')) return;
      checkingRef.current = true;
      try {
        await api.get('/api/auth/me');
      } catch (err: any) {
        if (err.response?.status === 401) {
          dispatch(logout());
          if (typeof window !== 'undefined') {
            window.location.href = '/login?reason=account_locked';
          }
        }
      } finally {
        checkingRef.current = false;
      }
    };

    // Kiểm tra ngay khi chuyển tab quay lại
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const interval = setInterval(checkSession, 3000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (channel) {
        channel.close();
      }
    };
  }, [isAuthenticated, user?.id, dispatch]);

  return null;
}
