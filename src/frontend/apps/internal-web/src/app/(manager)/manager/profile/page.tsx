'use client';

import React from 'react';
import ProfileWorkspaceView from '@/components/profile/ProfileWorkspaceView';

export default function ManagerProfilePage() {
  return (
    <ProfileWorkspaceView
      portalName="Quản Lý Dịch Vụ"
      dashboardHref="/dashboard"
      hideHeader
    />
  );
}
