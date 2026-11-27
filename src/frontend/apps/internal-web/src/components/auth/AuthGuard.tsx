'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

function WorkspaceSkeleton() {
  return (
    <div className="space-y-6 p-1" aria-busy="true" aria-label="Đang tải không gian làm việc">
      <div className="h-24 rounded-2xl bg-slate-200/70 animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-white border border-slate-200/80 p-4 space-y-3">
        <div className="h-8 w-56 rounded-lg bg-slate-100 animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-11 rounded-xl bg-slate-100/80 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, mounted, router]);

  // Render static workspace skeleton during SSR/hydration before auth state resolves
  if (!mounted || !isAuthenticated) {
    return <WorkspaceSkeleton />;
  }

  return <>{children}</>;
}
