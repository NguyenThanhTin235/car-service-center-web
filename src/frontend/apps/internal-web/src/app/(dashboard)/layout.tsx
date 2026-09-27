import SideNavBar from '@/components/layout/SideNavBar';
import TopNavBar from '@/components/layout/TopNavBar';
import React from 'react';
import AuthGuard from '@/components/auth/AuthGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md min-h-screen flex flex-col antialiased">
      <SideNavBar />
      <TopNavBar />
      <main className="ml-[16rem] mt-[68px] p-6 flex-1 bg-surface flex flex-col gap-6">
        <AuthGuard>
          {children}
        </AuthGuard>
      </main>
    </div>
  );
}
