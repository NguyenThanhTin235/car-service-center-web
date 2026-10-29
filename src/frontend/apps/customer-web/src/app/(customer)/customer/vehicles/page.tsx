'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VehiclesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/customer/profile?tab=vehicles');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Đang chuyển đến danh sách xe...</p>
      </div>
    </div>
  );
}
