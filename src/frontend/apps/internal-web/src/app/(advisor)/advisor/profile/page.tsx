'use client';

import React from 'react';
import ProfileWorkspaceView from '@/components/profile/ProfileWorkspaceView';

export default function AdvisorProfilePage() {
  return (
    <ProfileWorkspaceView
      portalName="Cố Vấn Dịch Vụ"
      dashboardHref="/advisor"
      isAdvisorShell
    />
  );
}
