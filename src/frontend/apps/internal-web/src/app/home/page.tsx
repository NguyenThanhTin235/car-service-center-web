'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { getDashboardPathByRole } from '@/utils/roleRedirect';

export default function InternalHomePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user) {
      const isInternal = user.roles?.some((r: string) => ['ADMIN', 'MANAGER', 'DESK STAFF', 'SA'].includes(r));
      if (isInternal) {
        router.replace(getDashboardPathByRole(user.roles));
        return;
      }
    }
    router.replace('/login');
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low">
      <div className="w-8 h-8 rounded-full border-2 border-outline-variant border-t-primary-container animate-spin"></div>
    </div>
  );
}
