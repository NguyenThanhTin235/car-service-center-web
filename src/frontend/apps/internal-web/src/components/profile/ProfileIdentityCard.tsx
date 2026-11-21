'use client';

import React from 'react';
import Link from 'next/link';
import { InternalUserProfile } from '@/lib/api/profile.api';
import {
  formatDateVi,
  formatEmployeeCode,
  formatPositionLabelVi,
  formatRoleLabelVi,
  getInitials,
} from './profileUtils';

export interface ProfileIdentityCardProps {
  profile: InternalUserProfile;
  dashboardHref: string;
}

export default function ProfileIdentityCard({
  profile,
  dashboardHref,
}: ProfileIdentityCardProps) {
  const initials = getInitials(profile.fullName, 'NV');
  const employee = profile.employee;

  return (
    <aside className="bg-white rounded-2xl border border-slate-200/85 p-6 lg:sticky lg:top-24">
      {/* Primary Identity */}
      <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-start gap-4">
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0866ff] to-[#0050cd] text-white font-mono text-xl font-bold flex items-center justify-center shrink-0">
          {initials}
          <span
            title={profile.isActive ? 'Tài khoản đang hoạt động' : 'Tài khoản tạm khóa'}
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ring-2 ring-white ${
              profile.isActive ? 'bg-emerald-500' : 'bg-slate-400'
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight truncate">
            {profile.fullName}
          </h2>
          <p className="text-sm text-slate-600 truncate mt-0.5">{profile.email}</p>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {profile.roles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-[#0050cd] text-xs font-semibold"
              >
                {formatRoleLabelVi(role)}
              </span>
            ))}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                profile.isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  profile.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
              {profile.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
            </span>
          </div>
        </div>
      </div>

      {/* HR & Account Metadata */}
      <div className="mt-6 pt-5 border-t border-slate-100">
        <h3 className="text-xs font-bold text-slate-800 mb-3.5">Thông tin nhân sự</h3>

        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">Mã tài khoản</dt>
            <dd className="font-mono tabular-nums font-semibold text-slate-900">
              USR-{String(profile.id).padStart(4, '0')}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">Mã nhân viên</dt>
            <dd className="font-mono tabular-nums font-semibold text-slate-900">
              {employee ? formatEmployeeCode(employee.id) : 'Chưa liên kết'}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">Chức vụ xưởng</dt>
            <dd className="font-semibold text-slate-900 text-right">
              {employee ? formatPositionLabelVi(employee.position) : 'Quản trị / Văn phòng'}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">Số điện thoại</dt>
            <dd className="font-mono tabular-nums font-semibold text-slate-900">
              {profile.phone || 'Chưa cập nhật'}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">Ngày tham gia</dt>
            <dd className="font-mono tabular-nums font-medium text-slate-800">
              {formatDateVi(profile.createdAt)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Technical Skills (if linked employee has skills) */}
      {employee && employee.skills.length > 0 && (
        <div className="mt-5 pt-5 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 mb-2.5">Kỹ năng chuyên môn</h3>
          <div className="flex flex-wrap gap-1.5">
            {employee.skills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick return link */}
      <div className="mt-6 pt-5 border-t border-slate-100">
        <Link
          href={dashboardHref}
          className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050cd]/40"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Quay lại bảng điều hành</span>
        </Link>
      </div>
    </aside>
  );
}
