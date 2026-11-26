import React, { Suspense } from 'react';
import ProfilePageClient from './ProfilePageClient';
import { LoadingSkeleton } from '@/components/ui';

export type { TabKey } from './ProfilePageClient';

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="py-4">
          <LoadingSkeleton variant="cards" count={3} />
        </div>
      }
    >
      <ProfilePageClient />
    </Suspense>
  );
}
