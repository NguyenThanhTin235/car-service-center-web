'use client';

import React from 'react';
import AdvisorTopNav from './AdvisorTopNav';

export default function AdvisorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#f2f4f8] text-zinc-900 font-body-md text-body-md min-h-screen flex flex-col antialiased overflow-x-clip">
      <AdvisorTopNav />
      <main className="md:ml-[76px] flex-1 bg-[#f2f4f8] flex flex-col pb-20 md:pb-6">
        {children}
      </main>
    </div>
  );
}
