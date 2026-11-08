'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { userApi, UserData } from '@/lib/api/users';
import SaaSWaveChart from '@/components/shared/SaaSWaveChart';
import toast from 'react-hot-toast';

const ROLES = ['ADMIN', 'MANAGER', 'ADVISOR', 'FRONT_DESK', 'TECHNICIAN', 'CUSTOMER'];

const normalizeRoleKey = (role: string): string => {
  const r = (role || '').toUpperCase().trim().replace(/[\s-]+/g, '_');
  if (r === 'SA' || r === 'SERVICE_ADVISOR' || r === 'CO_VAN') return 'ADVISOR';
  if (r === 'DESK_STAFF' || r === 'DESKSTAFF' || r === 'LE_TAN') return 'FRONT_DESK';
  if (r === 'QUAN_TRI' || r === 'ADMINISTRATOR') return 'ADMIN';
  if (r === 'QUAN_LY') return 'MANAGER';
  if (r === 'KY_THUAT_VIEN' || r === 'TECH') return 'TECHNICIAN';
  if (r === 'KHACH_HANG') return 'CUSTOMER';
  return r;
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  MANAGER: 'Quản lý',
  ADVISOR: 'Cố vấn',
  FRONT_DESK: 'Lễ tân',
  TECHNICIAN: 'Kỹ thuật viên',
  CUSTOMER: 'Khách hàng',
};

const ROLE_BG: Record<string, string> = {
  ADMIN: 'bg-purple-50 text-purple-700 border border-purple-200/80',
  MANAGER: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
  ADVISOR: 'bg-blue-50 text-[#0050cd] border border-blue-200/80',
  FRONT_DESK: 'bg-sky-50 text-sky-700 border border-sky-200/80',
  TECHNICIAN: 'bg-amber-50 text-amber-800 border border-amber-200/80',
  CUSTOMER: 'bg-slate-100 text-slate-700 border border-slate-200',
};

const getRoleLabel = (role: string): string => {
  const key = normalizeRoleKey(role);
  return ROLE_LABELS[key] || role;
};

const getRoleBg = (role: string): string => {
  const key = normalizeRoleKey(role);
  return ROLE_BG[key] || 'bg-slate-100 text-slate-700 border border-slate-200';
};

const getPositionLabel = (pos?: string, roles?: string[]): string => {
  const roleName = roles?.[0] ? normalizeRoleKey(roles[0]) : '';
  if (roleName === 'MANAGER') return 'Quản lý';
  if (roleName === 'FRONT_DESK') return 'Lễ tân';
  if (roleName === 'ADVISOR') return 'Cố vấn';
  if (roleName === 'TECHNICIAN') return 'Kỹ thuật viên';
  if (roleName === 'ADMIN') return 'Quản trị viên';
  if (roleName === 'CUSTOMER') return 'Khách hàng';

  if (pos) {
    const p = pos.toUpperCase();
    if (p === 'ADVISOR') return 'Cố vấn';
    if (p === 'TECHNICIAN' || p === 'DETAILER' || p === 'QC_STAFF') return 'Kỹ thuật viên';
    if (p === 'MANAGER') return 'Quản lý';
    if (p === 'FRONT_DESK' || p === 'OTHER') return 'Lễ tân';
  }
  return 'Nhân viên';
};

interface FormData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  address: string;
  role: string;
}
const defaultForm: FormData = {
  email: '',
  password: '',
  fullName: '',
  phone: '',
  address: '',
  role: 'ADVISOR',
};

export default function AccountsPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [pagination, setPagination] = useState({
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
  });
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [newPassword, setNewPassword] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadUsers = useCallback(
    async (page = 1) => {
      setLoading(true);
      setPageError(null);
      try {
        const res = await userApi.getAll({
          search,
          role: filterRole || undefined,
          page,
          limit: 10,
        });
        setUsers(res.data?.data || []);
        if (res.data?.pagination) {
          setPagination(res.data.pagination);
        }
      } catch (e: any) {
        setPageError(e.response?.data?.message || 'Không thể tải danh sách tài khoản.');
      } finally {
        setLoading(false);
      }
    },
    [search, filterRole]
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openCreate = () => {
    setEditingUser(null);
    setFormData(defaultForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (u: UserData) => {
    setEditingUser(u);
    setFormData({
      email: u.email,
      password: '',
      fullName: u.fullName,
      phone: u.phone || '',
      address: u.address || '',
      role: u.roles.find((r: string) => r !== 'CUSTOMER') || u.roles[0] || 'ADVISOR',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editingUser) {
        await userApi.update(editingUser.id, {
          fullName: formData.fullName,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          role: formData.role,
        });
        toast.success('Đã cập nhật thông tin tài khoản');
      } else {
        await userApi.create({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          role: formData.role,
        });
        toast.success('Đã cấp tài khoản mới thành công');
      }
      setShowModal(false);
      loadUsers(pagination.currentPage);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Có lỗi xảy ra khi lưu tài khoản');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (u: UserData) => {
    try {
      if (u.isActive) {
        await userApi.deactivate(u.id);
        toast.success(`Đã tạm khóa tài khoản ${u.fullName}`);
      } else {
        await userApi.reactivate(u.id);
        toast.success(`Đã kích hoạt lại tài khoản ${u.fullName}`);
      }
      loadUsers(pagination.currentPage);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Không thể thay đổi trạng thái tài khoản');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUserId || !newPassword) return;
    setSubmitting(true);
    try {
      await userApi.resetPassword(selectedUserId, newPassword);
      setShowResetModal(false);
      toast.success('Đặt lại mật khẩu thành công');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Không thể đặt lại mật khẩu');
    } finally {
      setSubmitting(false);
    }
  };

  const activeCount = useMemo(() => users.filter((u) => u.isActive).length, [users]);
  const inactiveCount = useMemo(() => users.filter((u) => !u.isActive).length, [users]);
  const staffCount = useMemo(
    () => users.filter((u) => !u.roles.includes('CUSTOMER')).length,
    [users]
  );

  return (
    <div className="space-y-6">
      {/* 1. SAAS HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Tài khoản & Phân quyền
        </h1>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadUsers(pagination.currentPage)}
            className="h-10 px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:opacity-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Cấp tài khoản mới</span>
          </button>
        </div>
      </div>

      {/* 2. ASYMMETRICAL BENTO GRID (Matches Ember Reference Layout) */}
      <div
        data-testid="admin-bento-grid"
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
      >
        {/* LEFT COLUMN (5/12): Hero IAM Card + Security Posture Card */}
        <div className="lg:col-span-5 flex flex-col gap-5 justify-between">
          {/* HERO CARD 1: Deep Sapphire IAM Card with Pure SVG Security Badge Graphic */}
            <div className="relative rounded-2xl bg-gradient-to-br from-[#091528] via-[#0c1f3d] to-[#0050cd] text-white p-6 border border-blue-900/60 shadow-sm flex items-center justify-between gap-4 min-h-[176px]">
              <div className="relative z-10 flex flex-col justify-between">
                <span className="text-xs font-medium text-slate-200">
                  Tổng định danh đã cấp phát (IAM)
                </span>
                <div className="mt-2 font-mono tabular-nums text-4xl font-extrabold tracking-tight">
                  {pagination.totalRecords || users.length}
                  <span className="text-base font-semibold text-slate-200 ml-2">tài khoản</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/25 text-emerald-200 font-bold">
                    {activeCount} đang hoạt động
                  </span>
                  <span className="text-slate-200">• {staffCount} nhân sự nội bộ</span>
                </div>
              </div>

              {/* Pure SVG Stylized IAM Keycard Illustration */}
              <svg
                width="140"
                height="92"
                viewBox="0 0 140 92"
                fill="none"
                aria-hidden="true"
                className="relative z-10 hidden sm:block shrink-0 -rotate-6"
              >
                <defs>
                  <linearGradient id="admCardGrad" x1="0" y1="92" x2="140" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0050cd" />
                    <stop offset="55%" stopColor="#0866ff" />
                    <stop offset="100%" stopColor="#60a5fa" />
                  </linearGradient>
                </defs>
                <rect x="2" y="2" width="136" height="88" rx="14" fill="url(#admCardGrad)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
                <rect x="14" y="16" width="24" height="16" rx="4" fill="#fcd34d" />
                <circle cx="114" cy="24" r="7" fill="rgba(255,255,255,0.35)" />
                <circle cx="122" cy="24" r="7" fill="rgba(255,255,255,0.6)" />
                <rect x="14" y="54" width="54" height="6" rx="3" fill="rgba(255,255,255,0.45)" />
                <rect x="14" y="66" width="84" height="8" rx="4" fill="rgba(255,255,255,0.85)" />
              </svg>
            </div>

            {/* HERO CARD 2: Quick Role & Status Breakdown */}
            <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  Trạng thái Kiểm soát Truy cập
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0050cd] font-mono text-xs font-bold">
                  Trang {pagination.currentPage}/{pagination.totalPages}
                </span>
              </div>

              <div className="grid grid-cols-3 divide-x divide-slate-200 pt-4 mt-4 border-t border-slate-100">
                <div className="pr-3">
                  <div className="text-xs font-medium text-slate-600">Tổng số</div>
                  <div className="font-mono tabular-nums text-2xl font-extrabold text-[#0050cd] mt-1">
                    {pagination.totalRecords}
                  </div>
                </div>
                <div className="px-3">
                  <div className="text-xs font-medium text-slate-600">Hoạt động</div>
                  <div className="font-mono tabular-nums text-2xl font-extrabold text-emerald-700 mt-1">
                    {activeCount}
                  </div>
                </div>
                <div className="pl-3">
                  <div className="text-xs font-medium text-slate-600">Tạm khóa</div>
                  <div className="font-mono tabular-nums text-2xl font-extrabold text-rose-700 mt-1">
                    {inactiveCount}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (7/12): SaaS Multi-Curve Wave Chart */}
          <div className="lg:col-span-7 flex flex-col">
            <SaaSWaveChart
              testId="admin-wave-chart"
              title="Phân bổ Vai trò Hệ thống & Tần suất Xác thực Phiên (IAM)"
              primaryMetric={`${activeCount}/${pagination.totalRecords || users.length} định danh kích hoạt`}
              deltaText="99.9%"
              deltaPositive={true}
              comparisonText="độ sẵn sàng dịch vụ xác thực"
              xLabels={['Admin', 'Manager', 'Advisor', 'Front Desk', 'Customer']}
              yLabels={['100', '75', '50', '25', '0']}
              series={[
                {
                  label: 'Đang hoạt động',
                  value: activeCount,
                  color: '#0866ff',
                  peakRatio: 0.9,
                },
                {
                  label: 'Nhân sự nội bộ',
                  value: staffCount,
                  color: '#38bdf8',
                  peakRatio: 0.72,
                },
                {
                  label: 'Tổng định danh',
                  value: pagination.totalRecords || users.length,
                  color: '#10b981',
                  peakRatio: 0.56,
                },
                {
                  label: 'Đã khóa',
                  value: inactiveCount,
                  color: '#818cf8',
                  peakRatio: 0.3,
                },
              ]}
            />
          </div>
        </div>

        {/* 3. HIGH-DENSITY ACCOUNTS DATA TABLE (4-State UI Protocol) */}
        <div className="w-full rounded-2xl bg-white shadow-xs border border-slate-200/80 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 border-b border-slate-200/80">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex items-center gap-2 flex-1 max-w-lg h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:border-[#0866ff] transition-all">
                <span className="material-symbols-outlined text-slate-500 text-[18px] shrink-0">
                  search
                </span>
                <input
                  className="flex-1 min-w-0 bg-transparent text-slate-900 placeholder:text-slate-500 text-xs focus:outline-none"
                  placeholder="Tìm theo Họ tên, Email, SĐT..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadUsers(1)}
                />
              </div>
              <div className="w-full sm:w-48">
                <select
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-[#0866ff] cursor-pointer"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="">Tất cả vai trò</option>
                  {ROLES.map((r: string) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {['', 'ADMIN', 'MANAGER', 'ADVISOR', 'FRONT_DESK', 'CUSTOMER'].map((r) => (
                <button
                  key={r || 'ALL'}
                  type="button"
                  onClick={() => setFilterRole(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filterRole === r
                      ? 'bg-[#0866ff] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                    }`}
                >
                  {r ? ROLE_LABELS[r] : 'Tất cả'}
                </button>
              ))}
            </div>
          </div>

          {pageError && (
            <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-rose-800">{pageError}</span>
              <button
                type="button"
                onClick={() => loadUsers(1)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Data table */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[820px]">
              <thead>
                <tr className="h-10 bg-slate-50/90 text-slate-600 text-xs uppercase tracking-wider font-bold border-b border-slate-200/80">
                  <th className="px-4 font-mono">User ID</th>
                  <th className="px-4">Họ và tên</th>
                  <th className="px-4">Email</th>
                  <th className="px-4">Số điện thoại</th>
                  <th className="px-4">Trạng thái</th>
                  <th className="px-4 text-right pr-6">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  [1, 2, 3, 4].map((row) => (
                    <tr key={row} className="h-14 animate-pulse">
                      <td colSpan={6} className="px-4">
                        <div className="h-8 bg-slate-100 rounded-lg w-full" />
                      </td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-xs text-slate-600">
                      Không tìm thấy tài khoản nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className={`h-14 hover:bg-blue-50/30 transition-colors ${!user.isActive ? 'opacity-65' : ''
                        }`}
                    >
                      <td className="px-4 font-mono tabular-nums text-xs font-bold text-[#0050cd]">
                        USR-{String(user.id).padStart(4, '0')}
                      </td>
                      <td className="px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0866ff] to-[#0050cd] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                            {user.fullName
                              .split(' ')
                              .map((n: string) => n[0])
                              .slice(-2)
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              {user.fullName}
                            </div>
                            <div className="text-xs text-slate-600">
                              {getPositionLabel(user.employee?.position, user.roles)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 font-mono text-xs text-slate-600">{user.email}</td>
                      <td className="px-4 font-mono tabular-nums text-xs text-slate-600">
                        {user.phone || '—'}
                      </td>
                      <td className="px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggle(user)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
                              user.isActive ? 'bg-[#0866ff]' : 'bg-slate-300'
                            } focus:outline-none`}
                            role="switch"
                            aria-checked={user.isActive}
                            title="Đổi trạng thái hoạt động"
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                                user.isActive ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span
                            className={`text-xs font-semibold ${
                              user.isActive ? 'text-emerald-700' : 'text-slate-500'
                            }`}
                          >
                            {user.isActive ? 'Hoạt động' : 'Tạm khóa'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(user)}
                            className="w-8 h-8 rounded-lg hover:bg-blue-50 text-slate-600 hover:text-[#0050cd] flex items-center justify-center transition-colors cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setNewPassword('');
                              setShowResetModal(true);
                            }}
                            className="w-8 h-8 rounded-lg hover:bg-blue-50 text-slate-600 hover:text-[#0050cd] flex items-center justify-center transition-colors cursor-pointer"
                            title="Đặt lại mật khẩu"
                          >
                            <span className="material-symbols-outlined text-[18px]">key</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80">
            <span className="text-xs text-slate-700">
              Hiển thị <span className="font-mono font-bold text-slate-900">{users.length}</span>{' '}
              trong tổng số{' '}
              <span className="font-mono font-bold text-slate-900">
                {pagination.totalRecords}
              </span>{' '}
              tài khoản
            </span>
            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => loadUsers(page)}
                    className={`w-8 h-8 rounded-lg font-mono text-xs font-bold transition-colors cursor-pointer ${
                      page === pagination.currentPage
                        ? 'bg-[#0866ff] text-white shadow-2xs'
                        : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">
                  {editingUser ? 'Cập nhật tài khoản' : 'Cấp tài khoản mới'}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-700">Họ và tên *</span>
                    <input
                      required
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, fullName: e.target.value }))
                      }
                      className="h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#0866ff]"
                      placeholder="Nguyễn Văn A"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-700">Email *</span>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      disabled={!!editingUser}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, email: e.target.value }))
                      }
                      className={`h-10 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0866ff] ${editingUser ? 'bg-slate-100 text-slate-500' : 'bg-white'
                        }`}
                      placeholder="email@company.com"
                    />
                  </label>
                  {!editingUser && (
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-slate-700">Mật khẩu *</span>
                      <input
                        required
                        type="password"
                        value={formData.password}
                        minLength={6}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, password: e.target.value }))
                        }
                        className="h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#0866ff]"
                        placeholder="Tối thiểu 6 ký tự"
                      />
                    </label>
                  )}
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-700">Số điện thoại</span>
                    <input
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, phone: e.target.value }))
                      }
                      className="h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#0866ff]"
                      placeholder="0901234567"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-700">Vai trò *</span>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, role: e.target.value }))
                      }
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#0866ff] cursor-pointer"
                    >
                      {ROLES.map((r: string) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-xs font-semibold text-slate-700">Địa chỉ</span>
                    <input
                      value={formData.address}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, address: e.target.value }))
                      }
                      className="h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#0866ff]"
                      placeholder="Số nhà, đường, quận, thành phố"
                    />
                  </label>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="h-10 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Hủy thao tác
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#0866ff] to-[#0050cd] text-white text-xs font-bold transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {submitting
                      ? 'Đang lưu...'
                      : editingUser
                        ? 'Lưu cập nhật tài khoản'
                        : 'Xác nhận cấp tài khoản'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reset password modal */}
        {showResetModal && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Đặt lại mật khẩu</h2>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
              <div className="p-5 space-y-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-700">Mật khẩu mới *</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#0866ff]"
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </label>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="h-10 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={submitting || newPassword.length < 6}
                    className="h-10 px-5 rounded-xl bg-[#0866ff] text-white text-xs font-bold disabled:opacity-60 cursor-pointer"
                  >
                    {submitting ? 'Đang lưu...' : 'Xác nhận đổi mật khẩu'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      );
}
