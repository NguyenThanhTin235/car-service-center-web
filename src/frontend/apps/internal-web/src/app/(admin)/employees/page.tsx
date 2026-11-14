'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { employeeApi, EmployeeData } from '@/lib/api/employees';
import { userApi, UserData } from '@/lib/api/users';
import ConfirmModal from '@/components/shared/ConfirmModal';
import Modal from '@/components/shared/Modal';
import TablePagination from '@/components/shared/TablePagination';
import ComboBox from '@/components/shared/ComboBox';
import toast from 'react-hot-toast';
import { validateName, validateRequired } from '@/lib/utils/validators';

const EmployeeDetailModal = dynamic(
  () => import('@/components/admin/EmployeeDetailModal'),
  { ssr: false }
);

const POSITIONS: Record<string, string> = {
  TECHNICIAN: 'Kỹ thuật viên',
  QC_STAFF: 'QC Staff',
  DETAILER: 'Detailer',
  ADVISOR: 'Cố vấn',
  MANAGER: 'Quản lý',
  FRONT_DESK: 'Lễ tân',
};

const POS_COLOR: Record<string, string> = {
  MANAGER: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  TECHNICIAN: 'bg-amber-50 text-amber-800 border-amber-200/80',
  QC_STAFF: 'bg-purple-50 text-purple-700 border-purple-200/80',
  DETAILER: 'bg-teal-50 text-teal-700 border-teal-200/80',
  ADVISOR: 'bg-blue-50 text-[#0050cd] border-blue-200/80',
  FRONT_DESK: 'bg-sky-50 text-sky-700 border-sky-200/80',
};

const getPositionMeta = (pos?: string, email?: string) => {
  const p = String(pos || '').toUpperCase();
  const mail = String(email || '').toLowerCase();

  if (p === 'QC_STAFF' || p === 'QC STAFF' || p === 'QC') {
    return { key: 'QC_STAFF', label: 'QC Staff', color: POS_COLOR.QC_STAFF };
  }
  if (p === 'DETAILER') {
    return { key: 'DETAILER', label: 'Detailer', color: POS_COLOR.DETAILER };
  }
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

const isTechRole = (pos: string) => ['TECHNICIAN', 'DETAILER', 'QC_STAFF'].includes(String(pos || '').toUpperCase());

interface FormData { fullName: string; position: string; userId: string; skillIds: number[]; }
const defaultForm: FormData = { fullName: '', position: 'TECHNICIAN', userId: '', skillIds: [] };

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [skills, setSkills] = useState<{ id: number; name: string }[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserData[]>([]);
  const [pagination, setPagination] = useState({ totalRecords: 0, totalPages: 1, currentPage: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [filterPos, setFilterPos] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<EmployeeData | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [confirmEmp, setConfirmEmp] = useState<{ emp: EmployeeData; action: 'deactivate' | 'reactivate' } | null>(null);
  const [selectedEmpDetail, setSelectedEmpDetail] = useState<EmployeeData | null>(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadEmployees = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await employeeApi.getAll({
        search,
        position: filterPos || undefined,
        status: filterStatus || undefined,
        page,
        limit: 10,
      });
      setEmployees(res.data.data);
      setPagination(res.data.pagination);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [search, filterPos, filterStatus]);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);
  useEffect(() => { employeeApi.getSkills().then(res => setSkills(res.data.data)).catch(() => {}); }, []);

  const openCreate = () => { 
    setEditingEmp(null);
    setFormData(defaultForm);
    setError('');
    setFieldErrors({}); 
    loadAvailableUsers();
    setShowModal(true); 
  };
  const openEdit = (e: EmployeeData) => {
    const meta = getPositionMeta(e.position, e.user?.email);
    const hasSkills = isTechRole(meta.key);
    setEditingEmp(e);
    setFormData({
      fullName: e.fullName,
      position: meta.key,
      userId: e.user?.id.toString() || '',
      skillIds: hasSkills ? e.skills.map((s) => s.id) : [],
    });
    setError('');
    setFieldErrors({});
    loadAvailableUsers();
    setShowModal(true);
  };
  
  const loadAvailableUsers = async () => {
    try {
      const res = await userApi.getAll({ limit: 100 });
      const users: UserData[] = res.data.data;
      setAvailableUsers(users);
    } catch (e) {
      console.error('Không tải được danh sách tài khoản', e);
    }
  };
  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const errors: Record<string, string> = {};
    const nameErr = validateName(formData.fullName, 'Họ và tên', 2, 100);
    if (nameErr) errors.fullName = nameErr;

    const posErr = validateRequired(formData.position, 'Chức vụ');
    if (posErr) errors.position = posErr;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // TC-ADM-21: Chặn liên kết tài khoản đã được gán cho nhân viên khác
    if (formData.userId) {
      const selectedUser = availableUsers.find((u) => String(u.id) === formData.userId);
      if (selectedUser?.employee && (!editingEmp || selectedUser.employee.id !== editingEmp.id)) {
        const errorMsg = 'Tài khoản này đã được liên kết với nhân viên khác.';
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }
    }

    setSubmitting(true);
    setError('');
    setFieldErrors({});
    const hasSkills = isTechRole(formData.position);
    try {
      if (editingEmp) {
        await employeeApi.update(editingEmp.id, {
          fullName: formData.fullName.trim(),
          position: formData.position,
          userId: formData.userId ? parseInt(formData.userId) : null,
          skillIds: hasSkills ? formData.skillIds : [],
        });
        toast.success(`Cập nhật nhân viên "${formData.fullName.trim()}" thành công`);
      } else {
        await employeeApi.create({
          fullName: formData.fullName.trim(),
          position: formData.position,
          userId: formData.userId ? parseInt(formData.userId) : undefined,
          skillIds: hasSkills ? formData.skillIds : [],
        });
        toast.success(`Thêm nhân viên "${formData.fullName.trim()}" thành công`);
      }
      setShowModal(false);
      loadEmployees(pagination.currentPage);
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Có lỗi xảy ra';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
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
        toast.success(`Đã vô hiệu hóa nhân viên "${confirmEmp.emp.fullName}" thành công`);
      } else {
        await employeeApi.reactivate(confirmEmp.emp.id);
        toast.success(`Đã kích hoạt lại nhân viên "${confirmEmp.emp.fullName}" thành công`);
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
      {/* 1. Asymmetrical 12-Col Bento Summary (5 + 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Navy (#0c2340) - Tổng nhân sự hệ thống (5 cols) */}
        <div className="lg:col-span-5 rounded-[24px] bg-[#0c2340] text-white p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between min-h-[170px] shadow-md hover:shadow-lg transition-all group">
          <div className="absolute inset-0 saas-subtle-grid pointer-events-none opacity-40" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-300 tracking-wide">Tổng nhân sự hệ thống</span>
              <div className="text-3xl sm:text-4xl font-mono font-extrabold tabular-nums tracking-tight text-white mt-1.5">
                {pagination.totalRecords}{' '}
                <span className="text-sm font-sans font-medium text-zinc-300">nhân viên</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-xs text-zinc-300 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[22px]">groups</span>
            </div>
          </div>
          <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-300">
            <span>Danh mục kỹ năng kỹ thuật</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 font-mono font-bold text-white">
              {skills.length} kỹ năng
            </span>
          </div>
        </div>

        {/* 3 Status & Position Tiles (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 2: Royal Blue (#0050cd) - Đang hoạt động */}
          <div
            onClick={() => setFilterStatus(filterStatus === 'active' ? '' : 'active')}
            className={`rounded-[24px] p-5 flex flex-col justify-between cursor-pointer transition-all select-none shadow-md group ${
              filterStatus === 'active'
                ? 'bg-[#0050cd] text-white ring-2 ring-white/60 shadow-lg'
                : 'bg-[#0050cd] text-white hover:brightness-105'
            }`}
            title="Bấm để lọc danh sách đang hoạt động"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-100 tracking-wide">Đang hoạt động</span>
              <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">engineering</span>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold tabular-nums text-white mt-2">
              {activeCount}
            </div>
            <div className="flex items-center justify-between text-[11px] text-blue-100 mt-2 pt-2 border-t border-white/15">
              <span>Sẵn sàng nhận việc</span>
              <span className="font-mono font-bold">Trực ca</span>
            </div>
          </div>

          {/* Card 3: Soft Cool Slate (#e4e7ec) - Ngừng hoạt động */}
          <div
            onClick={() => setFilterStatus(filterStatus === 'inactive' ? '' : 'inactive')}
            className={`rounded-[24px] p-5 flex flex-col justify-between cursor-pointer transition-all select-none shadow-xs group ${
              filterStatus === 'inactive'
                ? 'bg-[#e4e7ec] text-zinc-900 ring-2 ring-slate-400 shadow-md'
                : 'bg-[#e4e7ec] text-zinc-900 hover:brightness-95'
            }`}
            title="Bấm để lọc danh sách ngừng hoạt động"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 tracking-wide">Ngừng hoạt động</span>
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-300 text-rose-600 flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[18px]">person_off</span>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold tabular-nums text-zinc-900 mt-2">
              {employees.length - activeCount}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-300/80">
              <span>Tạm ngưng nhận việc</span>
              <span className="font-mono font-semibold text-rose-700">Tạm dừng</span>
            </div>
          </div>

          {/* Card 4: Midnight Indigo (#111827) - Kỹ năng hệ thống */}
          <div className="rounded-[24px] bg-[#111827] text-white p-5 flex flex-col justify-between shadow-md hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 tracking-wide">Kỹ năng hệ thống</span>
              <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 text-cyan-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">psychology</span>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold tabular-nums text-white mt-2">
              {skills.length}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-white/10">
              <span>Chuyên môn kỹ thuật</span>
              <span className="font-mono font-bold text-cyan-400">Chứng chỉ</span>
            </div>
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
            <div className="w-full sm:w-44">
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
            <div className="w-full sm:w-44">
              <select
                className="w-full h-9 px-3 rounded-xl bg-slate-50/80 border border-slate-200/80 text-slate-700 font-semibold text-xs focus:outline-none focus:border-[#0866ff] cursor-pointer"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Ngừng hoạt động</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
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

            <button
              onClick={openCreate}
              className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:brightness-110 text-white flex items-center gap-1.5 text-xs font-bold transition-all active:scale-[0.98] shadow-sm shadow-[#0866ff]/20 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[17px]">person_add</span>
              <span>Thêm nhân viên</span>
            </button>
          </div>
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
                <th className="py-3.5 px-5 text-right pr-6">Thao tác</th>
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-900">{emp.fullName}</span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${
                              emp.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                : 'bg-rose-50 text-rose-600 border-rose-200/80'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${emp.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {emp.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                          </span>
                        </div>
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
                      {(() => {
                        const meta = getPositionMeta(emp.position, emp.user?.email);
                        if (!isTechRole(meta.key)) {
                          return (
                            <span className="text-xs text-slate-400 italic">
                              Không áp dụng
                            </span>
                          );
                        }
                        if (!emp.skills || emp.skills.length === 0) {
                          return (
                            <span className="text-xs text-slate-400 italic">
                              Chưa gán kỹ năng
                            </span>
                          );
                        }
                        return (
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
                        );
                      })()}
                    </td>
                    <td className="py-3.5 px-5 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedEmpDetail(emp)}
                          className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 text-slate-600 hover:text-[#0866ff] flex items-center justify-center transition-colors cursor-pointer"
                          title="Xem chi tiết nhân viên"
                        >
                          <span className="material-symbols-outlined text-[17px]">visibility</span>
                        </button>
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
                            title="Kích hoạt lại"
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

        <TablePagination
          totalRecords={pagination.totalRecords}
          totalPages={pagination.totalPages}
          currentPage={pagination.currentPage}
          onPageChange={loadEmployees}
          currentCount={employees.length}
          recordLabel="nhân viên"
        />
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingEmp ? 'Cập nhật nhân viên' : 'Thêm nhân viên'}
        size="lg"
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
                    onChange={(e) => {
                      setFormData((p) => ({ ...p, fullName: e.target.value }));
                      if (fieldErrors.fullName) setFieldErrors((p) => ({ ...p, fullName: '' }));
                    }}
                    className={`h-10 px-3 border rounded-xl text-sm transition-colors ${
                      fieldErrors.fullName
                        ? 'bg-white border-rose-400 focus:border-rose-500 ring-2 ring-rose-400/20'
                        : 'bg-slate-50/50 focus:bg-white border-slate-200 focus:border-[#0866ff] focus:ring-2 focus:ring-[#0866ff]/15'
                    }`}
                    placeholder="Nguyễn Văn A"
                  />
                  {fieldErrors.fullName && (
                    <p className="text-[11px] text-rose-500 font-medium">{fieldErrors.fullName}</p>
                  )}
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">Chức vụ *</span>
                  <select
                    required
                    value={formData.position}
                    onChange={(e) => {
                      const newPos = e.target.value;
                      setFormData((p) => ({
                        ...p,
                        position: newPos,
                        skillIds: isTechRole(newPos) ? p.skillIds : [],
                      }));
                      if (fieldErrors.position) setFieldErrors((p) => ({ ...p, position: '' }));
                    }}
                    className={`w-full h-10 px-3 border rounded-xl text-sm cursor-pointer transition-colors ${
                      fieldErrors.position
                        ? 'bg-white border-rose-400 focus:border-rose-500 ring-2 ring-rose-400/20'
                        : 'bg-slate-50/50 focus:bg-white border-slate-200 focus:border-[#0866ff]'
                    }`}
                  >
                    {Object.entries(POSITIONS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.position && (
                    <p className="text-[11px] text-rose-500 font-medium">{fieldErrors.position}</p>
                  )}
                </label>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Tài khoản liên kết</span>
                    {editingEmp && Boolean(formData.userId) && (
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, userId: '' }))}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                        title="Gỡ tài khoản này khỏi nhân viên"
                      >
                        <span className="material-symbols-outlined text-[14px]">link_off</span>
                        <span>Gỡ tài khoản</span>
                      </button>
                    )}
                  </div>
                  <ComboBox
                    options={[
                      { id: '', label: '-- Không liên kết (Gỡ tài khoản) --' },
                      ...availableUsers.map((u) => {
                        const isLinkedOther = u.employee && (!editingEmp || u.employee.id !== editingEmp.id);
                        return {
                          id: String(u.id),
                          label: isLinkedOther
                            ? `${u.email} - ${u.fullName} (Đã liên kết)`
                            : `${u.email} - ${u.fullName}`,
                          subLabel: u.phone ? `SĐT: ${u.phone}` : undefined,
                        };
                      }),
                    ]}
                    value={formData.userId}
                    onChange={(val) => {
                      const newUserId = String(val);
                      setFormData((p) => ({ ...p, userId: newUserId }));
                      if (newUserId) {
                        const selectedUser = availableUsers.find((u) => String(u.id) === newUserId);
                        if (selectedUser?.employee && (!editingEmp || selectedUser.employee.id !== editingEmp.id)) {
                          setError('Tài khoản này đã được liên kết với nhân viên khác.');
                        } else if (error === 'Tài khoản này đã được liên kết với nhân viên khác.') {
                          setError('');
                        }
                      } else if (error === 'Tài khoản này đã được liên kết với nhân viên khác.') {
                        setError('');
                      }
                    }}
                    placeholder="Tìm theo email hoặc họ tên tài khoản..."
                  />
                  {editingEmp && !formData.userId && editingEmp.user && (
                    <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1.5 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80">
                      <span className="material-symbols-outlined text-[15px] text-amber-600 shrink-0">info</span>
                      <span>
                        Tài khoản <strong>{editingEmp.user.email}</strong> sẽ được gỡ khỏi nhân viên sau khi bạn nhấn <strong>&quot;Cập nhật&quot;</strong>.
                      </span>
                    </p>
                  )}
                </div>
              </div>
              {isTechRole(formData.position) ? (
                skills.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                      <span>Kỹ năng chuyên môn</span>
                      <span className="text-[11px] text-[#0866ff] font-medium font-mono">
                        Đã chọn {formData.skillIds.length}/{skills.length}
                      </span>
                    </div>
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
                )
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-blue-600 shrink-0">info</span>
                  <span>
                    Chức vụ <strong>{POSITIONS[formData.position] || formData.position}</strong> không áp dụng kỹ năng kỹ thuật (Kỹ năng chỉ dành cho nhân sự kỹ thuật).
                  </span>
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
                  {submitting ? 'Đang lưu...' : editingEmp ? 'Cập nhật' : 'Lưu lại'}
                </button>
              </div>
            </form>
      </Modal>
      <ConfirmModal
        isOpen={!!confirmEmp}
        title={confirmEmp?.action === 'deactivate' ? 'Vô hiệu hóa nhân viên' : 'Kích hoạt lại nhân viên'}
        message={
          confirmEmp
            ? confirmEmp.action === 'deactivate'
              ? `Bạn có chắc chắn muốn vô hiệu hóa nhân viên "${confirmEmp.emp.fullName}" không? Nhân viên sẽ không còn xuất hiện trong danh sách điều phối công việc của Cố vấn.`
              : `Bạn có chắc chắn muốn kích hoạt lại nhân viên "${confirmEmp.emp.fullName}" không?`
            : ''
        }
        confirmText={confirmEmp?.action === 'deactivate' ? 'Vô hiệu hóa' : 'Kích hoạt lại'}
        isDestructive={confirmEmp?.action === 'deactivate'}
        onConfirm={handleConfirmEmpAction}
        onCancel={() => setConfirmEmp(null)}
      />

      <EmployeeDetailModal
        isOpen={!!selectedEmpDetail}
        onClose={() => setSelectedEmpDetail(null)}
        employeeId={selectedEmpDetail?.id || null}
        fallbackData={selectedEmpDetail}
        onEdit={(emp) => {
          setSelectedEmpDetail(null);
          openEdit(emp);
        }}
      />
    </div>
  );
}
