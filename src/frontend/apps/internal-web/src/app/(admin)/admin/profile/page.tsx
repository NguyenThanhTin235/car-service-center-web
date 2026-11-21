'use client';

import React from 'react';
import ProfileWorkspaceView from '@/components/profile/ProfileWorkspaceView';

export default function AdminProfilePage() {
  return (
    <ProfileWorkspaceView
      portalName="Quản Trị Hệ Thống"
      dashboardHref="/admin"
      hideHeader
    />
  );
}
