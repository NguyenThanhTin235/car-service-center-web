'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { userApi, UserData } from '@/lib/api/users';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number | null;
  fallbackData?: {
    id: number;
    title: string;
    subtitle: string;
    status: string;
    timestamp: string;
  } | null;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  MANAGER: 'Quản lý xưởng',
  ADVISOR: 'Cố vấn dịch vụ',
  SA: 'Cố vấn dịch vụ (SA)',
  FRONT_DESK: 'Nhân viên lễ tân',
  'DESK STAFF': 'Nhân viên lễ tân',
  TECHNICIAN: 'Kỹ thuật viên',
  CUSTOMER: 'Khách hàng',
};

const ROLE_BG: Record<string, string> = {
  ADMIN: 'bg-purple-50 text-purple-700 border-purple-200/80',
  MANAGER: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  ADVISOR: 'bg-blue-50 text-[#0050cd] border-blue-200/80',
  SA: 'bg-blue-50 text-[#0050cd] border-blue-200/80',
  FRONT_DESK: 'bg-sky-50 text-sky-700 border-sky-200/80',
  'DESK STAFF': 'bg-sky-50 text-sky-700 border-sky-200/80',
  TECHNICIAN: 'bg-amber-50 text-amber-800 border-amber-200/80',
  CUSTOMER: 'bg-slate-100 text-slate-700 border-slate-200',
};

const normalizeRole = (r: string) => {
  const upper = (r || '').toUpperCase().trim();
  if (upper === 'DESK_STAFF' || upper === 'DESKSTAFF') return 'FRONT_DESK';
  if (upper === 'SERVICE_ADVISOR') return 'ADVISOR';
  return upper;
};

export default function UserDetailModal({
  isOpen,
  onClose,
  userId,
  fallbackData,
}: UserDetailModalProps) {
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !userId) {
      setUserData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await userApi.getById(userId);
        if (isMounted) {
          setUserData(res.data?.data || res.data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Không thể tải thông tin chi tiết người dùng.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const fullName = userData?.fullName || fallbackData?.title || 'Người dùng';
  const email = userData?.email || fallbackData?.subtitle || '—';
  const isActive = userData ? Boolean(userData.isActive ?? userData.is_active ?? true) : fallbackData?.status === 'ACTIVE';
  const createdAt = userData?.createdAt || fallbackData?.timestamp;
  const roles = userData?.roles || [];
  const employee = userData?.employee;

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#0050cd] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">badge</span>
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Chi tiết Tài khoản Người dùng
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Mã định danh IAM: USR-{String(userId || fallbackData?.id || 0).padStart(4, '0')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
            title="Đóng"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-500 text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* User Hero Banner */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/80">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0050cd] to-[#0866ff] text-white font-extrabold flex items-center justify-center text-xl shrink-0 shadow-md shadow-blue-500/20">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-slate-900 truncate">
                  {fullName}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  {isActive ? 'Đang hoạt động' : 'Tạm khóa'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">{email}</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 py-4 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/3" />
              <div className="h-10 bg-slate-100 rounded-xl w-full" />
              <div className="h-10 bg-slate-100 rounded-xl w-full" />
              <div className="h-10 bg-slate-100 rounded-xl w-full" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Basic IAM Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-blue-600">mail</span>
                    Địa chỉ Email
                  </span>
                  <span className="text-xs font-mono font-medium text-slate-800 break-all select-all">
                    {email}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-emerald-600">phone</span>
                    Số điện thoại
                  </span>
                  <span className="text-xs font-mono font-medium text-slate-800">
                    {userData?.phone || 'Chưa cập nhật'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col gap-1 sm:col-span-2">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-amber-600">home</span>
                    Địa chỉ liên hệ
                  </span>
                  <span className="text-xs text-slate-800">
                    {userData?.address || 'Chưa cập nhật địa chỉ'}
                  </span>
                </div>
              </div>

              {/* Roles Section */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-white">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-2.5">
                  <span className="material-symbols-outlined text-[16px] text-[#0050cd]">
                    admin_panel_settings
                  </span>
                  Phân quyền &amp; Vai trò hệ thống (RBAC)
                </span>
                <div className="flex flex-wrap gap-2">
                  {roles.length > 0 ? (
                    roles.map((r: string) => {
                      const normalized = normalizeRole(r);
                      const label = ROLE_LABELS[normalized] || ROLE_LABELS[r] || r;
                      const bg = ROLE_BG[normalized] || ROLE_BG[r] || 'bg-slate-100 text-slate-700 border-slate-200';
                      return (
                        <span
                          key={r}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border ${bg}`}
                        >
                          {label}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-slate-500 italic">
                      Chưa gán vai trò quản trị
                    </span>
                  )}
                </div>
              </div>

              {/* Employee section (if linked) */}
              {employee && (
                <div className="p-4 rounded-xl border border-blue-200/70 bg-blue-50/20">
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mb-2.5">
                    <span className="material-symbols-outlined text-[16px] text-blue-600">engineering</span>
                    Thông tin Nhân sự Kỹ thuật
                  </span>
                  <div className="text-xs text-slate-700 mb-2">
                    <span className="font-semibold text-slate-900">Vị trí đảm nhiệm:</span>{' '}
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-[#0050cd] font-semibold">
                      {employee.position}
                    </span>
                  </div>
                  {Array.isArray(employee.skills) && employee.skills.length > 0 && (
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                        Kỹ năng chuyên môn:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {employee.skills.map((s: any) => (
                          <span
                            key={s.id || s.name}
                            className="px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-medium"
                          >
                            ✓ {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Timestamp */}
              {createdAt && (
                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                  <span>Ngày khởi tạo tài khoản</span>
                  <span className="font-mono text-slate-700 font-semibold">
                    {new Date(createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-3">
          <Link
            href={`/accounts?search=${encodeURIComponent(email)}`}
            onClick={onClose}
            className="text-xs font-semibold text-[#0050cd] hover:underline flex items-center gap-1"
          >
            <span>Mở trong Quản lý Tài khoản</span>
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
