'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { resolveNotificationCenterHref } from '@/components/notifications/notificationUtils';

export default function NotificationsRedirectPage() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const targetHref = resolveNotificationCenterHref(user?.roles || []);
    router.replace(targetHref);
  }, [router, user?.roles]);

  return (
    <div className="min-h-[240px] flex items-center justify-center">
      <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500">
        <span className="material-symbols-outlined text-[18px] animate-spin text-[#0050cd]">
          progress_activity
        </span>
        <span>Đang chuyển hướng đến Trung tâm thông báo...</span>
      </div>
    </div>
  );
}
