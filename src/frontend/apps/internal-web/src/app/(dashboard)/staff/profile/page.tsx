'use client';

import React from 'react';
import ProfileWorkspaceView from '@/components/profile/ProfileWorkspaceView';

export default function StaffProfilePage() {
  return (
    <ProfileWorkspaceView
      portalName="Quầy Dịch Vụ"
      dashboardHref="/staff"
      hideHeader
    />
  );
}
