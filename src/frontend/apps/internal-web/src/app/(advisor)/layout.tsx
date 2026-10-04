import AdvisorLayout from '@/components/advisor/layout/AdvisorLayout';
import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AdvisorLayout>
      {children}
    </AdvisorLayout>
  );
}
