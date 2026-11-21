'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { InternalUserProfile, profileApi } from '@/lib/api/profile.api';
import ProfileIdentityCard from './ProfileIdentityCard';
import ProfileInfoForm from './ProfileInfoForm';
import ProfileSecurityForm from './ProfileSecurityForm';
import ProfileSkeleton from './ProfileSkeleton';

export interface ProfileWorkspaceViewProps {
  portalName: string;
  dashboardHref: string;
  isAdvisorShell?: boolean;
  hideHeader?: boolean;
}

type ProfileTab = 'info' | 'security';

export default function ProfileWorkspaceView({
  portalName,
  dashboardHref,
  isAdvisorShell = false,
  hideHeader = false,
}: ProfileWorkspaceViewProps) {
  const [profile, setProfile] = useState<InternalUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('info');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await profileApi.getMyProfile();
      setProfile(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Không thể tải thông tin hồ sơ cá nhân. Vui lòng kiểm tra kết nối và thử lại.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <section
      data-testid="internal-profile-page"
      className={`max-w-[1200px] mx-auto w-full space-y-6 ${
        isAdvisorShell ? 'py-3 pb-24 md:pb-8' : 'pb-8'
      }`}
    >
      {/* Page Header (Hidden for Admin/Staff/Manager shells that already show Top Context Bar title) */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-[-0.02em]">
              Hồ sơ cá nhân
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Quản lý thông tin liên hệ và bảo mật tài khoản tại phân hệ {portalName}.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchProfile}
            disabled={loading}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 min-h-[40px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99] text-xs font-semibold text-slate-700 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050cd]/40"
          >
            <span
              className={`material-symbols-outlined text-[17px] ${loading ? 'animate-spin' : ''}`}
            >
              sync
            </span>
            <span>Làm mới</span>
          </button>
        </div>
      )}

      {/* 4-State Content */}
      {loading && !profile ? (
        <ProfileSkeleton />
      ) : error && !profile ? (
        <div
          data-testid="profile-error-state"
          className="bg-white rounded-2xl border border-slate-200/85 p-10 text-center space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[26px]">cloud_off</span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Không thể tải hồ sơ</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">{error}</p>
          <div className="pt-2">
            <button
              type="button"
              onClick={fetchProfile}
              className="min-h-[44px] px-5 rounded-xl bg-[#0050cd] hover:bg-[#0866ff] text-white text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">refresh</span>
              <span>Thử lại</span>
            </button>
          </div>
        </div>
      ) : profile ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 4 cols: Identity & HR Metadata */}
          <div className="lg:col-span-4">
            <ProfileIdentityCard profile={profile} dashboardHref={dashboardHref} />
          </div>

          {/* Right 8 cols: Tabbed Profile & Security Workspace */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/85 overflow-hidden">
            {/* Tab Bar */}
            <div className="px-4 sm:px-6 pt-3 border-b border-slate-200/80 flex items-center justify-between gap-2">
              <div
                role="tablist"
                aria-label="Mục cài đặt hồ sơ"
                className="flex items-center gap-1 overflow-x-auto no-scrollbar"
              >
                <button
                  type="button"
                  role="tab"
                  data-testid="profile-tab-info"
                  aria-selected={activeTab === 'info'}
                  onClick={() => setActiveTab('info')}
                  className={`min-h-[44px] px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'info'
                      ? 'border-[#0050cd] text-[#0050cd]'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">badge</span>
                  <span>Thông tin cá nhân</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  data-testid="profile-tab-security"
                  aria-selected={activeTab === 'security'}
                  onClick={() => setActiveTab('security')}
                  className={`min-h-[44px] px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'security'
                      ? 'border-[#0050cd] text-[#0050cd]'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">shield_lock</span>
                  <span>Bảo mật & Mật khẩu</span>
                </button>
              </div>

              {hideHeader && (
                <button
                  type="button"
                  onClick={fetchProfile}
                  disabled={loading}
                  title="Làm mới dữ liệu hồ sơ"
                  aria-label="Làm mới dữ liệu hồ sơ"
                  className="mb-1.5 inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 active:scale-[0.99] text-xs font-semibold text-slate-700 shrink-0 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050cd]/40"
                >
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      loading ? 'animate-spin' : ''
                    }`}
                  >
                    sync
                  </span>
                  <span className="hidden sm:inline">Làm mới</span>
                </button>
              )}
            </div>

            {/* Active Tab Panel */}
            {activeTab === 'info' ? (
              <ProfileInfoForm profile={profile} onUpdated={setProfile} />
            ) : (
              <ProfileSecurityForm />
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
