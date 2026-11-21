'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { employeeApi, EmployeeData } from '@/lib/api/employees';

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number | null;
  fallbackData?: EmployeeData | null;
  onEdit?: (emp: EmployeeData) => void;
}

const POSITION_CONFIG: Record<
  string,
  { label: string; badgeClass: string; roleType: string; isTech: boolean }
> = {
  TECHNICIAN: {
    label: 'Kỹ thuật viên',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
    roleType: 'Nhân sự Kỹ thuật & Xưởng sửa chữa',
    isTech: true,
  },
  MANAGER: {
    label: 'Quản lý xưởng',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    roleType: 'Khối Quản trị & Điều phối hoạt động',
    isTech: false,
  },
  ADVISOR: {
    label: 'Cố vấn dịch vụ',
    badgeClass: 'bg-blue-50 text-[#0050cd] border-blue-200/80',
    roleType: 'Tư vấn tiếp nhận & Chăm sóc khách hàng',
    isTech: false,
  },
  FRONT_DESK: {
    label: 'Nhân viên lễ tân',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/80',
    roleType: 'Tiếp đón & Hướng dẫn khách hàng',
    isTech: false,
  },
  OTHER: {
    label: 'Nhân sự nội bộ',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    roleType: 'Bộ phận hỗ trợ vận hành',
    isTech: false,
  },
};

const resolvePositionInfo = (position?: string, email?: string) => {
  const p = String(position || '').toUpperCase().trim();
  const mail = String(email || '').toLowerCase();

  if (p === 'MANAGER' || mail.includes('manager')) return POSITION_CONFIG.MANAGER;
  if (p === 'ADVISOR' || mail.includes('advisor')) return POSITION_CONFIG.ADVISOR;
  if (p === 'FRONT_DESK' || p === 'RECEPTIONIST' || mail.includes('desk')) return POSITION_CONFIG.FRONT_DESK;
  if (p === 'TECHNICIAN' || p === 'DETAILER' || p === 'QC_STAFF') return POSITION_CONFIG.TECHNICIAN;
  return POSITION_CONFIG[p] || POSITION_CONFIG.OTHER;
};

export default function EmployeeDetailModal({
  isOpen,
  onClose,
  employeeId,
  fallbackData,
  onEdit,
}: EmployeeDetailModalProps) {
  const [detailData, setDetailData] = useState<any | null>(fallbackData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !employeeId) {
      setDetailData(fallbackData || null);
      setError(null);
      return;
    }

    if (fallbackData) {
      setDetailData(fallbackData);
    }

    let isMounted = true;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await employeeApi.getById(employeeId);
        if (isMounted) {
          const emp = res.data?.data || res.data;
          setDetailData(emp);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Không thể tải chi tiết nhân viên từ máy chủ.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [isOpen, employeeId, fallbackData]);

  if (!isOpen) return null;

  const currentEmp = detailData || fallbackData;
  const fullName = currentEmp?.fullName || 'Nhân viên';
  const posInfo = resolvePositionInfo(currentEmp?.position, currentEmp?.user?.email);
  const isActive = currentEmp ? (currentEmp.isActive ?? currentEmp.is_active ?? true) : true;
  const skills = currentEmp?.skills || [];
  const user = currentEmp?.user;
  const isUserActive = user ? Boolean(user.isActive ?? user.is_active ?? true) : true;

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'NV';

  const formattedDate = currentEmp?.createdAt
    ? new Date(currentEmp.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#0866ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">badge</span>
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Hồ sơ Chi tiết Nhân viên
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Mã định danh: EMP-{String(employeeId || currentEmp?.id || 0).padStart(4, '0')}
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

          {/* Hero Banner */}
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
                  {isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${posInfo.badgeClass}`}
                >
                  {posInfo.label}
                </span>
                <span className="text-xs text-slate-500">{posInfo.roleType}</span>
              </div>
            </div>
          </div>

          {loading && !detailData ? (
            <div className="space-y-3 py-4 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/3" />
              <div className="h-10 bg-slate-100 rounded-xl w-full" />
              <div className="h-10 bg-slate-100 rounded-xl w-full" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Linked User Account Card */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[17px] text-[#0866ff]">
                      account_circle
                    </span>
                    Tài khoản Người dùng Liên kết (IAM)
                  </span>
                  {user && (
                    <Link
                      href={`/accounts?search=${encodeURIComponent(user.email)}`}
                      className="text-xs font-semibold text-[#0866ff] hover:underline flex items-center gap-1"
                      onClick={onClose}
                    >
                      <span>Xem tài khoản</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                  )}
                </div>

                {user ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 flex flex-col gap-0.5">
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-blue-600">mail</span>
                        Email đăng nhập
                      </span>
                      <span className="text-xs font-mono font-medium text-slate-800 break-all select-all">
                        {user.email}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 flex flex-col gap-0.5">
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-emerald-600">phone</span>
                        Số điện thoại
                      </span>
                      <span className="text-xs font-mono font-medium text-slate-800">
                        {user.phone || 'Chưa cập nhật'}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 flex flex-col gap-0.5 sm:col-span-2">
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-blue-600">shield</span>
                        Trạng thái tài khoản đăng nhập
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isUserActive ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span
                          className={`text-xs font-semibold ${
                            isUserActive ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isUserActive ? 'Tài khoản đang hoạt động' : 'Tài khoản đã bị tạm khóa'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 italic text-center">
                    Nhân viên này chưa được liên kết với tài khoản người dùng đăng nhập hệ thống.
                  </div>
                )}
              </div>

              {/* Technical Skills Section */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-white">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[17px] text-amber-600">
                      build_circle
                    </span>
                    Kỹ năng Chuyên môn Kỹ thuật
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {posInfo.isTech ? `${skills.length} kỹ năng` : 'Không áp dụng'}
                  </span>
                </div>

                {posInfo.isTech ? (
                  skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((s: { id: number; name: string }) => (
                        <span
                          key={s.id}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50/80 text-blue-800 border border-blue-200/70 flex items-center gap-1.5 shadow-2xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0866ff]" />
                          {s.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/70 text-xs text-amber-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-600 text-[18px]">info</span>
                      <span>Kỹ thuật viên này hiện chưa được phân công kỹ năng chuyên môn nào.</span>
                    </div>
                  )
                ) : (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 text-xs text-slate-500 flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">verified_user</span>
                    <span>
                      Chức vụ <strong>{posInfo.label}</strong> thuộc khối vận hành/quản lý, không yêu cầu gán kỹ năng thao tác kỹ thuật xưởng.
                    </span>
                  </div>
                )}
              </div>

              {/* Timestamp Info */}
              <div className="px-4 py-3 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  Thời gian tạo hồ sơ
                </span>
                <span className="font-mono font-semibold text-slate-700">{formattedDate}</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400">Hệ thống Quản trị Car Service Center</span>
          <div className="flex items-center gap-2">
            {onEdit && currentEmp && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(currentEmp);
                }}
                className="h-9 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0866ff] border border-blue-200/80 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Chỉnh sửa hồ sơ</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl bg-slate-200/70 hover:bg-slate-300/80 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
