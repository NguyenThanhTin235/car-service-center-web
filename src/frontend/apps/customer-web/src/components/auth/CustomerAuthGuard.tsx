'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';

interface AuthGuardProps {
  children: React.ReactNode;
}

function CustomerPortalSkeleton() {
  return (
    <div className="min-h-[640px]" aria-busy="true" aria-label="Đang tải cổng khách hàng">
      <div className="h-5 w-44 rounded bg-surface-subtle animate-pulse mb-6" />
      <div className="flex flex-col md:flex-row items-start gap-6 lg:gap-8">
        <aside className="w-full md:w-64 lg:w-72 shrink-0 space-y-4">
          <div className="h-[82px] rounded-2xl bg-surface-elevated border border-hairline animate-pulse" />
          <div className="h-[52px] md:h-[420px] rounded-2xl bg-surface-subtle animate-pulse" />
        </aside>
        <div className="flex-1 w-full min-w-0 min-h-[560px] space-y-6">
          <div className="h-28 rounded-2xl bg-surface-subtle animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-surface-elevated border border-hairline animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-surface-elevated border border-hairline animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function CustomerAuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !isAuthenticated) {
    return <CustomerPortalSkeleton />;
  }

  return <>{children}</>;
}
