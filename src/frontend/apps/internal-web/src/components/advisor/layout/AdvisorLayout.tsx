import React from 'react';
import AdvisorTopNav from './AdvisorTopNav';

export default function AdvisorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#f2f4f8] text-zinc-900 font-body-md text-body-md min-h-screen flex flex-col antialiased overflow-x-clip">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#0866ff] focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow-lg"
      >
        Chuyển đến nội dung chính
      </a>
      <AdvisorTopNav />
      <main id="main-content" className="md:ml-[76px] flex-1 bg-[#f2f4f8] flex flex-col px-3 sm:px-5 lg:px-6 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-6">
        {children}
      </main>
    </div>
  );
}
