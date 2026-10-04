'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { employeeApi, EmployeeData } from '@/lib/api/employees';
import { userApi, UserData } from '@/lib/api/users';

const POSITIONS: Record<string, string> = { TECHNICIAN: 'Kỹ thuật viên', DETAILER: 'Detailer', QC_STAFF: 'QC Staff', ADVISOR: 'Cố vấn DV', OTHER: 'Khác' };
const POS_COLOR: Record<string, string> = { TECHNICIAN: 'bg-[#fffbeb] text-[#92400e]', DETAILER: 'bg-[#eff6ff] text-[#1d4ed8]', QC_STAFF: 'bg-[#ecfdf5] text-[#065f46]', ADVISOR: 'bg-[#0050cd]/10 text-[#0050cd]', OTHER: 'bg-[#f8f9ff] text-[#424656]' };

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
    setEditingEmp(e); setFormData({ fullName: e.fullName, position: e.position, userId: e.user?.id.toString() || '', skillIds: e.skills.map(s => s.id) });
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
  const handleDeactivate = async (emp: EmployeeData) => {
    if (!emp.isActive) return;
    if (!confirm(`Vô hiệu hóa nhân viên "${emp.fullName}"?`)) return;
    try { await employeeApi.deactivate(emp.id); loadEmployees(pagination.currentPage); }
    catch (e: any) { alert(e.response?.data?.message || 'Có lỗi xảy ra'); }
  };
  const handleReactivate = async (emp: EmployeeData) => {
    if (emp.isActive) return;
    if (!confirm(`Khôi phục nhân viên "${emp.fullName}"?`)) return;
    try { await employeeApi.reactivate(emp.id); loadEmployees(pagination.currentPage); }
    catch (e: any) { alert(e.response?.data?.message || 'Có lỗi xảy ra'); }
  };
  const toggleSkill = (id: number) => setFormData(p => ({ ...p, skillIds: p.skillIds.includes(id) ? p.skillIds.filter(s => s !== id) : [...p.skillIds, id] }));

  const activeCount = employees.filter(e => e.isActive).length;

  return (
    <div className="min-h-screen bg-[#f8f9ff] font-[Be_Vietnam_Pro,sans-serif] text-[#0b1c30]">
      <header className="fixed top-0 left-64 right-0 h-14 z-30 bg-white/90 backdrop-blur border-b border-[#c2c6d8]/30 flex items-center justify-between px-6">
        <div className="flex items-center gap-1 text-xs text-[#424656]">
          <span>Admin</span>
          <span className="material-symbols-outlined text-sm text-[#727687]">chevron_right</span>
          <span className="font-semibold text-[#0b1c30]">Quản lý Nhân viên</span>
        </div>
      </header>

      <main className="pt-14 px-6 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-[#0b1c30] tracking-tight">Quản lý Nhân viên</h1>
              <span className="px-2 py-0.5 rounded-full bg-[#e5eeff] text-[#0050cd] font-mono text-xs font-semibold">Staff Directory</span>
            </div>
            <p className="text-sm text-[#424656] mt-1">Quản lý hồ sơ nhân viên, chức vụ, kỹ năng và liên kết tài khoản hệ thống.</p>
          </div>
          <button onClick={openCreate} className="h-9 px-4 rounded bg-[#0866ff] hover:bg-[#1877f2] text-white flex items-center gap-2 text-xs font-semibold transition-all active:scale-[0.98] shadow-sm self-start lg:self-center">
            <span className="material-symbols-outlined text-lg">person_add</span>
            Thêm nhân viên
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Tổng nhân viên', value: pagination.totalRecords, icon: 'groups', color: 'text-[#0050cd]' },
            { label: 'Đang hoạt động', value: activeCount, icon: 'engineering', color: 'text-[#10b981]' },
            { label: 'Vô hiệu hóa', value: pagination.totalRecords - activeCount, icon: 'person_off', color: 'text-[#ef4444]' },
            { label: 'Kỹ năng hệ thống', value: skills.length, icon: 'psychology', color: 'text-[#525970]' },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl bg-white shadow-sm border border-[#e5eeff] flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#424656] uppercase tracking-wider font-semibold">{s.label}</span>
                <span className={`material-symbols-outlined text-lg ${s.color}`}>{s.icon}</span>
              </div>
              <div className="font-mono text-2xl font-bold text-[#0b1c30]">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="w-full rounded-xl bg-white shadow-sm border border-[#e5eeff] overflow-hidden">
          <div className="p-3 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 border-b border-[#e5eeff]">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1 max-w-lg">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#525970] text-lg">search</span>
                <input className="w-full h-9 pl-9 pr-4 rounded bg-[#eff4ff] text-[#0b1c30] placeholder:text-[#424656] text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0866ff] transition-all"
                  placeholder="Tìm theo Họ tên nhân viên..." value={search}
                  onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadEmployees(1)} />
              </div>
              <div className="relative w-full sm:w-44">
                <select className="w-full h-9 pl-3 pr-8 rounded bg-[#eff4ff] text-[#0b1c30] text-xs appearance-none focus:outline-none cursor-pointer"
                  value={filterPos} onChange={e => setFilterPos(e.target.value)}>
                  <option value="">Tất cả chức vụ</option>
                  {Object.entries(POSITIONS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#424656] text-sm">unfold_more</span>
              </div>
            </div>
            <button onClick={() => loadEmployees(1)} className="h-9 w-9 rounded bg-[#eff4ff] hover:bg-[#e5eeff] text-[#424656] flex items-center justify-center transition-colors" title="Làm mới">
              <span className="material-symbols-outlined text-lg">sync</span>
            </button>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="h-9 bg-[#f8f9ff] text-[#424656] text-[11px] uppercase tracking-wider font-semibold border-b border-[#e5eeff]">
                  <th className="px-4 font-mono">ID</th>
                  <th className="px-4">Họ và tên</th>
                  <th className="px-4">Chức vụ</th>
                  <th className="px-4">Tài khoản liên kết</th>
                  <th className="px-4">Kỹ năng</th>
                  <th className="px-4 text-right pr-6">Trạng thái & Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {loading ? (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-[#424656]">Đang tải dữ liệu...</td></tr>
                ) : employees.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-[#424656]">Không tìm thấy nhân viên phù hợp</td></tr>
                ) : employees.map(emp => (
                  <tr key={emp.id} className={`h-14 hover:bg-[#f8f9ff]/40 transition-colors ${!emp.isActive ? 'opacity-70' : ''}`}>
                    <td className="px-4 font-mono text-xs font-medium text-[#0050cd]">EMP-{String(emp.id).padStart(4, '0')}</td>
                    <td className="px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#0058bc] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {emp.fullName.split(' ').map((n: string) => n[0]).slice(-2).join('').toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-[#0b1c30]">{emp.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${POS_COLOR[emp.position] || 'bg-[#f8f9ff] text-[#424656]'}`}>
                        {POSITIONS[emp.position] || emp.position}
                      </span>
                    </td>
                    <td className="px-4">
                      {emp.user ? (
                        <div>
                          <div className="font-mono text-[11px] text-[#525970]">{emp.user.email}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${emp.user.isActive ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`}></span>
                            <span className="text-[10px] text-[#424656]">{emp.user.isActive ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>
                      ) : <span className="text-[11px] text-[#727687]">Chưa liên kết</span>}
                    </td>
                    <td className="px-4">
                      <div className="flex flex-wrap gap-1">
                        {emp.skills.slice(0, 2).map(s => (
                          <span key={s.id} className="px-1.5 py-0.5 rounded bg-[#f8f9ff] text-[#424656] text-[10px] border border-[#e5eeff]">{s.name}</span>
                        ))}
                        {emp.skills.length > 2 && <span className="text-[10px] text-[#727687]">+{emp.skills.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-4 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${emp.isActive ? 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]' : 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]'}`}>
                          {emp.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                        </span>
                        <button onClick={() => openEdit(emp)} className="w-7 h-7 rounded hover:bg-[#e5eeff] text-[#424656] flex items-center justify-center transition-colors" title="Chỉnh sửa">
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        {emp.isActive ? (
                          <button onClick={() => handleDeactivate(emp)} className="w-7 h-7 rounded bg-[#fef2f2] hover:bg-[#ef4444] hover:text-white text-[#ef4444] flex items-center justify-center transition-colors" title="Vô hiệu hóa">
                            <span className="material-symbols-outlined text-base">person_off</span>
                          </button>
                        ) : (
                          <button onClick={() => handleReactivate(emp)} className="w-7 h-7 rounded bg-[#ecfdf5] hover:bg-[#10b981] hover:text-white text-[#10b981] flex items-center justify-center transition-colors" title="Khôi phục">
                            <span className="material-symbols-outlined text-base">how_to_reg</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#e5eeff]">
            <span className="text-xs text-[#424656]">
              Hiển thị <span className="font-semibold text-[#0b1c30]">{employees.length}</span> trong tổng số <span className="font-semibold text-[#0b1c30]">{pagination.totalRecords}</span> nhân viên
            </span>
            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => loadEmployees(page)}
                    className={`w-8 h-8 rounded font-mono text-xs font-semibold transition-colors ${page === pagination.currentPage ? 'bg-[#0866ff] text-white' : 'bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30]'}`}>
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#e5eeff]">
              <h2 className="text-base font-semibold text-[#0b1c30]">{editingEmp ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}</h2>
              <button onClick={() => setShowModal(false)} className="w-7 h-7 rounded hover:bg-[#eff4ff] text-[#424656] flex items-center justify-center">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && <div className="p-3 rounded bg-[#fef2f2] text-[#dc2626] text-xs border border-[#fecaca]">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#424656]">Họ và tên *</span>
                  <input required value={formData.fullName} onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                    className="h-9 px-3 border border-[#c2c6d8] rounded text-sm bg-white focus:outline-none focus:border-[#0866ff] focus:ring-1 focus:ring-[#0866ff]"
                    placeholder="Nguyễn Văn A" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#424656]">Chức vụ *</span>
                  <div className="relative">
                    <select required value={formData.position} onChange={e => setFormData(p => ({ ...p, position: e.target.value }))}
                      className="w-full h-9 pl-3 pr-8 border border-[#c2c6d8] rounded text-sm bg-white appearance-none focus:outline-none focus:border-[#0866ff]">
                      {Object.entries(POSITIONS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#424656] text-sm">unfold_more</span>
                  </div>
                </label>
                <label className="flex flex-col gap-1 col-span-2">
                  <span className="text-xs font-semibold text-[#424656]">Tài khoản liên kết</span>
                  <div className="relative">
                    <select value={formData.userId} onChange={e => setFormData(p => ({ ...p, userId: e.target.value }))}
                      className="w-full h-9 pl-3 pr-8 border border-[#c2c6d8] rounded text-sm bg-white appearance-none focus:outline-none focus:border-[#0866ff]">
                      <option value="">-- Không liên kết (Bỏ trống) --</option>
                      {availableUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.email} - {u.fullName}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#424656] text-sm">unfold_more</span>
                  </div>
                </label>
              </div>
              {skills.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[#424656] mb-2">Kỹ năng</div>
                  <div className="flex flex-wrap gap-2">
                    {skills.map(s => (
                      <button key={s.id} type="button" onClick={() => toggleSkill(s.id)} className={`px-3 py-1.5 rounded border text-xs font-medium transition-all ${formData.skillIds.includes(s.id) ? 'bg-[#eff4ff] border-[#0866ff] text-[#0050cd]' : 'bg-white border-[#c2c6d8] text-[#424656] hover:border-[#0866ff]'}`}>
                        {formData.skillIds.includes(s.id) && <span className="mr-1">✓</span>}{s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="h-9 px-4 rounded border border-[#c2c6d8] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff]">Hủy</button>
                <button type="submit" disabled={submitting} className="h-9 px-4 rounded bg-[#0866ff] hover:bg-[#1877f2] text-white text-xs font-semibold disabled:opacity-60 active:scale-[0.98]">
                  {submitting ? 'Đang lưu...' : (editingEmp ? 'Cập nhật' : 'Tạo nhân viên')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
