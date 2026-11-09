'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { employeeApi, EmployeeData } from '@/lib/api/employees';
import { userApi, UserData } from '@/lib/api/users';
import ConfirmModal from '@/components/shared/ConfirmModal';
import toast from 'react-hot-toast';

const POSITIONS: Record<string, string> = {
  MANAGER: 'Quản lý',
  TECHNICIAN: 'Kỹ thuật viên',
  ADVISOR: 'Cố vấn',
  FRONT_DESK: 'Lễ tân',
};

const POS_COLOR: Record<string, string> = {
  MANAGER: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  TECHNICIAN: 'bg-amber-50 text-amber-800 border-amber-200/80',
  ADVISOR: 'bg-blue-50 text-[#0050cd] border-blue-200/80',
  FRONT_DESK: 'bg-sky-50 text-sky-700 border-sky-200/80',
};

const getPositionMeta = (pos?: string, email?: string) => {
  const p = String(pos || '').toUpperCase();
  const mail = String(email || '').toLowerCase();

  if (p === 'MANAGER' || mail.includes('manager')) {
    return { key: 'MANAGER', label: 'Quản lý', color: POS_COLOR.MANAGER };
  }
  if (p === 'ADVISOR' || mail.includes('advisor')) {
    return { key: 'ADVISOR', label: 'Cố vấn', color: POS_COLOR.ADVISOR };
  }
  if (p === 'FRONT_DESK' || p === 'RECEPTIONIST' || mail.includes('desk')) {
    return { key: 'FRONT_DESK', label: 'Lễ tân', color: POS_COLOR.FRONT_DESK };
  }
  return { key: 'TECHNICIAN', label: 'Kỹ thuật viên', color: POS_COLOR.TECHNICIAN };
};

interface FormData { fullName: string; position: string; userId: string; skillIds: number[]; }
const defaultForm: FormData = { fullName: '', position: 'TECHNICIAN', userId: '', skillIds: [] };

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [skills, setSkills] = useState<{ id: number; name: string }[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserData[]>([]);
  const [pagination, setPagination] = useState({ totalRecords: 0, totalPages: 1, currentPage: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [filterPos, setFilterPos] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<EmployeeData | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [confirmEmp, setConfirmEmp] = useState<{ emp: EmployeeData; action: 'deactivate' | 'reactivate' } | null>(null);
  const [error, setError] = useState('');

  const loadEmployees = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await employeeApi.getAll({ search, position: filterPos || undefined, page, limit: 10 });
      setEmployees(res.data.data); setPagination(res.data.pagination);
    } catch (e: any) { setError(e.response?.data?.message || 'Lỗi tải dữ liệu'); } finally { setLoading(false); }
  }, [search, filterPos]);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);
  useEffect(() => { employeeApi.getSkills().then(res => setSkills(res.data.data)).catch(() => {}); }, []);

  const openCreate = () => { 
    setEditingEmp(null); setFormData(defaultForm); setError(''); 
    loadAvailableUsers();
    setShowModal(true); 
  };
  const openEdit = (e: EmployeeData) => {
    const meta = getPositionMeta(e.position, e.user?.email);
    setEditingEmp(e);
    setFormData({
      fullName: e.fullName,
      position: meta.key,
      userId: e.user?.id.toString() || '',
      skillIds: e.skills.map((s) => s.id),
    });
    setError('');
    loadAvailableUsers(e.id);
    setShowModal(true);
  };
  
  const loadAvailableUsers = async (currentEmpId?: number) => {
    try {
      const res = await userApi.getAll({ limit: 100 });
      const users: UserData[] = res.data.data;
      // Lọc các user CHƯA liên kết với ai, hoặc ĐANG liên kết với nhân viên này
      const filtered = users.filter(u => !u.employee || (currentEmpId && u.employee.id === currentEmpId));
      setAvailableUsers(filtered);
    } catch (e) {
      console.error('Không tải được danh sách tài khoản', e);
    }
  };
  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault(); setSubmitting(true); setError('');
    try {
      const payload = { fullName: formData.fullName, position: formData.position, userId: formData.userId ? parseInt(formData.userId) : undefined, skillIds: formData.skillIds };
      editingEmp ? await employeeApi.update(editingEmp.id, payload) : await employeeApi.create(payload);
      setShowModal(false); loadEmployees(pagination.currentPage);
    } catch (e: any) { setError(e.response?.data?.message || 'Có lỗi xảy ra'); } finally { setSubmitting(false); }
  };
  const handleDeactivate = (emp: EmployeeData) => {
    if (!emp.isActive) return;
    setConfirmEmp({ emp, action: 'deactivate' });
  };
  const handleReactivate = (emp: EmployeeData) => {
    if (emp.isActive) return;
    setConfirmEmp({ emp, action: 'reactivate' });
  };

  const handleConfirmEmpAction = async () => {
    if (!confirmEmp) return;
    try {
      if (confirmEmp.action === 'deactivate') {
        await employeeApi.deactivate(confirmEmp.emp.id);
        toast.success(`Đã vô hiệu hóa nhân viên "${confirmEmp.emp.fullName}"`);
      } else {
        await employeeApi.reactivate(confirmEmp.emp.id);
        toast.success(`Đã khôi phục nhân viên "${confirmEmp.emp.fullName}"`);
      }
      loadEmployees(pagination.currentPage);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setConfirmEmp(null);
    }
  };
  const toggleSkill = (id: number) => setFormData(p => ({ ...p, skillIds: p.skillIds.includes(id) ? p.skillIds.filter(s => s !== id) : [...p.skillIds, id] }));

  const activeCount = employees.filter(e => e.isActive).length;

  return (
    <div className="space-y-6 text-slate-900">
      {/* 1. SaaS Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
          Quản lý Nhân viên
        </h1>
        <button
          onClick={openCreate}
          className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:brightness-110 text-white flex items-center gap-2 text-xs font-bold transition-all active:scale-[0.98] shadow-md shadow-[#0866ff]/20 self-start lg:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>Thêm nhân viên</span>
        </button>
      </div>

      {/* 2. Asymmetrical 12-Col Bento Summary (5 + 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Hero Card (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl saas-hero-gradient text-white p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 saas-subtle-grid pointer-events-none" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-blue-100/90">Tổng nhân sự hệ thống</span>
              <div className="text-3xl font-mono font-extrabold tabular-nums tracking-tight mt-1">
                {pagination.totalRecords}{' '}
                <span className="text-sm font-sans font-medium text-blue-100/80">nhân viên</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-xs">
              <span className="material-symbols-outlined text-[22px] text-white">groups</span>
            </div>
          </div>
          <div className="relative z-10 mt-4 pt-3.5 border-t border-white/15 flex items-center justify-between text-xs text-blue-50">
            <span>Danh mục kỹ năng kỹ thuật</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/15 font-mono font-semibold">
              {skills.length} kỹ năng
            </span>
          </div>
        </div>

        {/* 3 Status & Position Tiles (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="saas-card p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Đang hoạt động</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">engineering</span>
              </div>
            </div>
            <div className="text-2xl font-mono font-extrabold tabular-nums text-slate-900 mt-2">
              {activeCount}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium mt-1">Sẵn sàng nhận việc</span>
          </div>

          <div className="saas-card p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Vô hiệu hóa</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200/60 text-rose-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">person_off</span>
              </div>
            </div>
            <div className="text-2xl font-mono font-extrabold tabular-nums text-slate-900 mt-2">
              {Math.max(0, pagination.totalRecords - activeCount)}
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-1">Tạm ngưng công tác</span>
          </div>

          <div className="saas-card p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Kỹ năng hệ thống</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/60 text-[#0866ff] flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">psychology</span>
              </div>
            </div>
            <div className="text-2xl font-mono font-extrabold tabular-nums text-slate-900 mt-2">
              {skills.length}
            </div>
            <span className="text-[11px] text-[#0866ff] font-medium mt-1">Chuyên môn kỹ thuật</span>
          </div>
        </div>
      </div>

      {/* 3. Table card */}
      <div className="w-full saas-card overflow-hidden">
        <div className="p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 border-b border-slate-200/80">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="flex items-center gap-2 flex-1 max-w-lg h-9 px-3 rounded-xl bg-slate-50/80 border border-slate-200/80 focus-within:bg-white focus-within:border-[#0866ff] transition-all">
              <span className="material-symbols-outlined text-slate-500 text-[18px] shrink-0">
                search
              </span>
              <input
                className="flex-1 min-w-0 bg-transparent text-slate-900 placeholder:text-slate-500 text-xs focus:outline-none"
                placeholder="Tìm theo Họ tên nhân viên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadEmployees(1)}
              />
            </div>
            <div className="w-full sm:w-48">
              <select
                className="w-full h-9 px-3 rounded-xl bg-slate-50/80 border border-slate-200/80 text-slate-700 font-semibold text-xs focus:outline-none focus:border-[#0866ff] cursor-pointer"
                value={filterPos}
                onChange={(e) => setFilterPos(e.target.value)}
              >
                <option value="">Tất cả chức vụ</option>
                {Object.entries(POSITIONS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={() => loadEmployees(1)}
            className="h-9 px-3.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 text-slate-600 hover:text-[#0866ff] flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
            title="Làm mới"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin text-[#0866ff]' : ''}`}>
              sync
            </span>
            <span className=" sm:inline">Làm mới</span>
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200/80">
                <th className="py-3.5 px-5 font-mono">ID</th>
                <th className="py-3.5 px-5">Họ và tên</th>
                <th className="py-3.5 px-5">Chức vụ</th>
                <th className="py-3.5 px-5">Tài khoản liên kết</th>
                <th className="py-3.5 px-5">Kỹ năng</th>
                <th className="py-3.5 px-5 text-right pr-6">Trạng thái &amp; Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    Đang tải dữ liệu nhân sự...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    Không tìm thấy nhân viên phù hợp
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className={`hover:bg-blue-50/25 transition-colors ${
                      !emp.isActive ? 'opacity-65' : ''
                    }`}
                  >
                    <td className="py-3.5 px-5 font-mono text-xs font-bold text-[#0866ff]">
                      EMP-{String(emp.id).padStart(4, '0')}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0866ff] to-[#0050cd] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {emp.fullName
                            .split(' ')
                            .map((n: string) => n[0])
                            .slice(-2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{emp.fullName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      {(() => {
                        const meta = getPositionMeta(emp.position, emp.user?.email);
                        return (
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${meta.color}`}
                          >
                            {meta.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3.5 px-5">
                      {emp.user ? (
                        <div>
                          <div className="font-mono text-xs font-semibold text-slate-800">{emp.user.email}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                emp.user.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            <span className={`text-xs font-semibold ${emp.user.isActive ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {emp.user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Chưa liên kết</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex flex-wrap gap-1.5">
                        {emp.skills.slice(0, 2).map((s) => (
                          <span
                            key={s.id}
                            className="px-2 py-0.5 rounded-lg bg-blue-50/70 text-slate-700 text-xs border border-blue-200/60"
                          >
                            {s.name}
                          </span>
                        ))}
                        {emp.skills.length > 2 && (
                          <span className="text-xs font-mono text-slate-400">
                            +{emp.skills.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            emp.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                              : 'bg-rose-50 text-rose-700 border-rose-200/80'
                          }`}
                        >
                          {emp.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                        </span>
                        <button
                          onClick={() => openEdit(emp)}
                          className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 text-[#0866ff] flex items-center justify-center transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <span className="material-symbols-outlined text-[17px]">edit</span>
                        </button>
                        {emp.isActive ? (
                          <button
                            onClick={() => handleDeactivate(emp)}
                            className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-500 hover:text-white border border-rose-200/80 text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                            title="Vô hiệu hóa"
                          >
                            <span className="material-symbols-outlined text-[17px]">
                              person_off
                            </span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(emp)}
                            className="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-500 hover:text-white border border-emerald-200/80 text-emerald-600 flex items-center justify-center transition-colors cursor-pointer"
                            title="Khôi phục"
                          >
                            <span className="material-symbols-outlined text-[17px]">
                              how_to_reg
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80 bg-slate-50/40">
          <span className="text-xs text-slate-700">
            Hiển thị <span className="font-mono font-bold text-slate-900">{employees.length}</span>{' '}
            trong tổng số{' '}
            <span className="font-mono font-bold text-slate-900">{pagination.totalRecords}</span>{' '}
            nhân viên
          </span>
          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => loadEmployees(page)}
                  className={`w-8 h-8 rounded-lg font-mono text-xs font-semibold transition-colors cursor-pointer ${
                    page === pagination.currentPage
                      ? 'bg-[#0866ff] text-white'
                      : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200/80">
              <h2 className="text-base font-bold text-slate-900">
                {editingEmp ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs border border-rose-200">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">Họ và tên *</span>
                  <input
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
                    className="h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0866ff] focus:ring-2 focus:ring-[#0866ff]/15"
                    placeholder="Nguyễn Văn A"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">Chức vụ *</span>
                  <select
                    required
                    value={formData.position}
                    onChange={(e) => setFormData((p) => ({ ...p, position: e.target.value }))}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0866ff] cursor-pointer"
                  >
                    {Object.entries(POSITIONS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 col-span-2">
                  <span className="text-xs font-semibold text-slate-600">Tài khoản liên kết</span>
                  <select
                    value={formData.userId}
                    onChange={(e) => setFormData((p) => ({ ...p, userId: e.target.value }))}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0866ff] cursor-pointer"
                  >
                    <option value="">-- Không liên kết (Bỏ trống) --</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.email} - {u.fullName}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {skills.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-600 mb-2">Kỹ năng</div>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleSkill(s.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          formData.skillIds.includes(s.id)
                            ? 'bg-blue-50 border-[#0866ff] text-[#0866ff]'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-[#0866ff]'
                        }`}
                      >
                        {formData.skillIds.includes(s.id) && <span className="mr-1">✓</span>}
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#0866ff] to-[#0050cd] text-white text-xs font-bold disabled:opacity-60 active:scale-[0.98] cursor-pointer"
                >
                  {submitting ? 'Đang lưu...' : editingEmp ? 'Cập nhật' : 'Tạo nhân viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
          <ConfirmModal
        isOpen={!!confirmEmp}
        title={confirmEmp?.action === 'deactivate' ? 'Vô hiệu hóa nhân sự' : 'Khôi phục nhân sự'}
        message={confirmEmp ? `Bạn có chắc chắn muốn ${confirmEmp.action === 'deactivate' ? 'vô hiệu hóa' : 'khôi phục'} nhân viên "${confirmEmp.emp.fullName}" không?` : ''}
        confirmText={confirmEmp?.action === 'deactivate' ? 'Vô hiệu hóa' : 'Khôi phục'}
        isDestructive={confirmEmp?.action === 'deactivate'}
        onConfirm={handleConfirmEmpAction}
        onCancel={() => setConfirmEmp(null)}
      />
    </div>
  );
}
