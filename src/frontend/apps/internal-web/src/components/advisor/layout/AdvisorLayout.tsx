'use client';

import React from 'react';
import AdvisorTopNav from './AdvisorTopNav';

export default function AdvisorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md min-h-screen flex flex-col antialiased">
      <AdvisorTopNav />
      <main className="mt-[56px] flex-1 bg-surface flex flex-col">
        {children}
      </main>
    </div>
  );
}
