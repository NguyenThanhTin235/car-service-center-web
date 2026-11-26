'use client';

import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useState } from 'react';
import api from '@/lib/axios';
import { logout } from '@/store/slices/authSlice';

interface LogoutButtonProps {
  className?: string;
  iconOnly?: boolean;
}

export default function LogoutButton({ className = '', iconOnly = false }: LogoutButtonProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const refreshToken =
        typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
      await api.post('/api/auth/logout', refreshToken ? { refreshToken } : {});
    } catch {
    } finally {
      dispatch(logout());
      if (typeof window !== 'undefined') {
        if ('BroadcastChannel' in window) {
          try {
            const ch = new BroadcastChannel('csc_session_channel');
            ch.postMessage({ type: 'USER_LOGGED_OUT' });
            ch.close();
          } catch {}
        }
        window.location.href = '/login';
      }
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      data-testid="btn-logout"
      onClick={handleLogout}
      disabled={loading}
      aria-label="Đăng xuất"
      title="Đăng xuất"
      className={`flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866ff] ${className}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <span className="material-symbols-outlined text-xl">logout</span>
      )}
      {!iconOnly && <span>{loading ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>}
    </button>
  );
}
