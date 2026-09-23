'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      // Safe client-side redirect with setTimeout to prevent back-navigation ignore bug in Next.js
      setTimeout(() => {
        router.replace('/login');
      }, 50);
    }
  }, [isAuthenticated, mounted, router]);

  // Prevent hydration mismatch and hide content until authenticated
  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9ff]">
        <div className="w-8 h-8 rounded-full border-2 border-[#c2c6d8] border-t-[#0866ff] animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      {children}
    </div>
  );
}
