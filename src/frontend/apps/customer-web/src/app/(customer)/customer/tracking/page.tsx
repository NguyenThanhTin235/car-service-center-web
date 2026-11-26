import React, { Suspense } from 'react';
import ProfilePageClient from '@/app/(customer)/customer/profile/ProfilePageClient';
import { LoadingSkeleton } from '@/components/ui';

export default function CustomerTrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="py-4">
          <LoadingSkeleton variant="cards" count={3} />
        </div>
      }
    >
      <ProfilePageClient defaultTab="tracking" />
    </Suspense>
  );
}
