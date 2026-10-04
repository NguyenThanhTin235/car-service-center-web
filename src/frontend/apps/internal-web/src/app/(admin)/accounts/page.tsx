'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { userApi, UserData } from '@/lib/api/users';

const ROLES = ['ADMIN', 'ADVISOR', 'FRONT_DESK', 'MANAGER', 'CUSTOMER'];
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  ADVISOR: 'Advisor',
  FRONT_DESK: 'Front Desk',
  MANAGER: 'Manager',
  CUSTOMER: 'Customer',
};
const ROLE_BG: Record<string, string> = {
  ADMIN: 'bg-[#0050cd]/10 text-[#0050cd]',
  ADVISOR: 'bg-[#0058bc]/10 text-[#0058bc]',
  FRONT_DESK: 'bg-[#525970]/10 text-[#525970]',
  MANAGER: 'bg-[#0050cd]/10 text-[#0058bc]',
  CUSTOMER: 'bg-[#d3e4fe] text-[#424656]',
};

interface FormData { email: string; password: string; fullName: string; phone: string; address: string; role: string; }
const defaultForm: FormData = { email: '', password: '', fullName: '', phone: '', address: '', role: 'ADVISOR' };

export default function AccountsPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [pagination, setPagination] = useState({ totalRecords: 0, totalPages: 1, currentPage: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [newPassword, setNewPassword] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await userApi.getAll({ search, role: filterRole || undefined, page, limit: 10 });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Lỗi tải danh sách');
    } finally {
      setLoading(false);
    }
  }, [search, filterRole]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const openCreate = () => { setEditingUser(null); setFormData(defaultForm); setError(''); setShowModal(true); };
  const openEdit = (u: UserData) => {
    setEditingUser(u);
                    setFormData({ email: u.email, password: '', fullName: u.fullName, phone: u.phone || '', address: u.address || '', role: u.roles.find((r: string) => r !== 'CUSTOMER') || u.roles[0] || 'ADVISOR' });
    setError(''); setShowModal(true);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      if (editingUser) {
        await userApi.update(editingUser.id, { fullName: formData.fullName, phone: formData.phone || undefined, address: formData.address || undefined, role: formData.role });
      } else {
        await userApi.create({ email: formData.email, password: formData.password, fullName: formData.fullName, phone: formData.phone || undefined, address: formData.address || undefined, role: formData.role });
      }
      setShowModal(false); loadUsers(pagination.currentPage);
    } catch (e: any) { setError(e.response?.data?.message || 'Có lỗi xảy ra'); } finally { setSubmitting(false); }
  };
  const handleToggle = async (u: UserData) => {
    if (!confirm(`${u.isActive ? 'Vô hiệu hóa' : 'Khôi phục'} tài khoản "${u.fullName}"?`)) return;
    try { u.isActive ? await userApi.deactivate(u.id) : await userApi.reactivate(u.id); loadUsers(pagination.currentPage); }
    catch (e: any) { alert(e.response?.data?.message || 'Có lỗi xảy ra'); }
  };
  const handleResetPassword = async () => {
    if (!selectedUserId || !newPassword) return; setSubmitting(true);
    try { await userApi.resetPassword(selectedUserId, newPassword); setShowResetModal(false); alert('Đặt lại mật khẩu thành công'); }
    catch (e: any) { alert(e.response?.data?.message || 'Có lỗi xảy ra'); } finally { setSubmitting(false); }
  };

  const activeCount = users.filter(u => u.isActive).length;
  const inactiveCount = users.filter(u => !u.isActive).length;

  return (
    <div className="min-h-screen bg-[#f8f9ff] font-[Be_Vietnam_Pro,sans-serif] text-[#0b1c30]">
      {/* Top header */}
      <header className="fixed top-0 left-64 right-0 h-14 z-30 bg-white/90 backdrop-blur border-b border-[#c2c6d8]/30 flex items-center justify-between px-6">
        <div className="flex items-center gap-1 text-xs text-[#424656]">
          <span>Admin</span>
          <span className="material-symbols-outlined text-sm text-[#727687]">chevron_right</span>
          <span className="font-semibold text-[#0b1c30]">Tài khoản & Phân quyền</span>
        </div>
        <div className="relative max-w-xs w-full hidden md:block">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#727687] text-lg">search</span>
          <input className="w-full h-8 pl-9 pr-4 bg-[#eff4ff] text-[#0b1c30] placeholder:text-[#424656]/70 border border-[#c2c6d8]/40 rounded text-xs focus:outline-none focus:border-[#0866ff] transition-all"
            placeholder="Tìm kiếm tài khoản..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadUsers(1)} />
        </div>
      </header>

      <main className="pt-14 px-6 py-6">
        {/* Page header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-[#0b1c30] tracking-tight">Quản lý Tài khoản & Phân quyền</h1>
              <span className="px-2 py-0.5 rounded-full bg-[#e5eeff] text-[#0050cd] font-mono text-xs font-semibold">IAM Engine</span>
            </div>
            <p className="text-sm text-[#424656] mt-1">Quản trị định danh tập trung, kiểm soát truy cập và giám sát trạng thái tài khoản.</p>
          </div>
          <div className="flex items-center gap-2 self-start lg:self-center">
            <button onClick={openCreate}
              className="h-9 px-4 rounded bg-[#0866ff] hover:bg-[#1877f2] text-white flex items-center gap-2 text-xs font-semibold transition-all active:scale-[0.98] shadow-sm">
              <span className="material-symbols-outlined text-lg">person_add</span>
              Cấp tài khoản mới
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Tổng tài khoản', value: pagination.totalRecords, icon: 'group', color: 'text-[#0050cd]' },
            { label: 'Đang hoạt động', value: activeCount, icon: 'check_circle', color: 'text-[#10b981]' },
            { label: 'Vô hiệu hóa', value: inactiveCount, icon: 'lock', color: 'text-[#ef4444]' },
            { label: 'Trang hiện tại', value: `${pagination.currentPage}/${pagination.totalPages}`, icon: 'pages', color: 'text-[#525970]' },
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
          {/* Toolbar */}
          <div className="p-3 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 border-b border-[#e5eeff]">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1 max-w-lg">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#525970] text-lg">search</span>
                <input className="w-full h-9 pl-9 pr-4 rounded bg-[#eff4ff] text-[#0b1c30] placeholder:text-[#424656] text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0866ff] transition-all"
                  placeholder="Tìm theo Họ tên, Email, SĐT..." value={search}
                  onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadUsers(1)} />
              </div>
              <div className="relative w-full sm:w-44">
                <select className="w-full h-9 pl-3 pr-8 rounded bg-[#eff4ff] text-[#0b1c30] text-xs appearance-none focus:outline-none cursor-pointer"
                  value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                  <option value="">Tất cả vai trò</option>
                  {ROLES.map((r: string) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#424656] text-sm">unfold_more</span>
              </div>
            </div>
            <button onClick={() => loadUsers(1)} className="h-9 w-9 rounded bg-[#eff4ff] hover:bg-[#e5eeff] text-[#424656] flex items-center justify-center transition-colors" title="Làm mới">
              <span className="material-symbols-outlined text-lg">sync</span>
            </button>
          </div>

          {/* Data table */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="h-9 bg-[#f8f9ff] text-[#424656] text-[11px] uppercase tracking-wider font-semibold border-b border-[#e5eeff]">
                  <th className="px-4 font-mono">User ID</th>
                  <th className="px-4">Họ và tên</th>
                  <th className="px-4">Email</th>
                  <th className="px-4">Số điện thoại</th>
                  <th className="px-4">Vai trò</th>
                  <th className="px-4 text-right pr-6">Trạng thái & Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {loading ? (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-[#424656]">Đang tải dữ liệu...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-[#424656]">Không tìm thấy dữ liệu phù hợp</td></tr>
                ) : users.map(user => (
                  <tr key={user.id} className={`h-14 hover:bg-[#f8f9ff]/40 transition-colors ${!user.isActive ? 'opacity-70' : ''}`}>
                    <td className="px-4 font-mono text-xs font-medium text-[#0050cd]">USR-{String(user.id).padStart(4, '0')}</td>
                    <td className="px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#0866ff] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {user.fullName.split(' ').map((n: string) => n[0]).slice(-2).join('').toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#0b1c30]">{user.fullName}</div>
                          <div className="text-[11px] text-[#424656]">{user.employee?.position || 'Staff'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 font-mono text-xs text-[#525970]">{user.email}</td>
                    <td className="px-4 font-mono text-xs text-[#424656]">{user.phone || '—'}</td>
                    <td className="px-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role: string) => (
                          <span key={role} className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${ROLE_BG[role] || 'bg-[#e5eeff] text-[#424656]'}`}>
                            {ROLE_LABELS[role] || role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleToggle(user)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${user.isActive ? 'bg-[#0866ff]' : 'bg-[#d3e4fe]'} focus:outline-none`}
                            role="switch" aria-checked={user.isActive} title="Trạng thái">
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${user.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                          <span className="font-mono text-[10px] text-[#424656] w-16">
                            {user.isActive ? 'Hoạt động' : 'Tạm khóa'}
                          </span>
                        </div>
                        <button onClick={() => openEdit(user)} className="w-7 h-7 rounded hover:bg-[#e5eeff] text-[#424656] flex items-center justify-center transition-colors" title="Chỉnh sửa">
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button onClick={() => { setSelectedUserId(user.id); setNewPassword(''); setShowResetModal(true); }}
                          className="w-7 h-7 rounded hover:bg-[#e5eeff] text-[#424656] flex items-center justify-center transition-colors" title="Đặt lại mật khẩu">
                          <span className="material-symbols-outlined text-base">key</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#e5eeff]">
            <span className="text-xs text-[#424656]">
              Hiển thị <span className="font-semibold text-[#0b1c30]">{users.length}</span> trong tổng số <span className="font-semibold text-[#0b1c30]">{pagination.totalRecords}</span> tài khoản
            </span>
            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => loadUsers(page)}
                    className={`w-8 h-8 rounded font-mono text-xs font-semibold transition-colors ${page === pagination.currentPage ? 'bg-[#0866ff] text-white' : 'bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30]'}`}>
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#e5eeff]">
              <h2 className="text-base font-semibold text-[#0b1c30]">
                {editingUser ? 'Cập nhật tài khoản' : 'Cấp tài khoản mới'}
              </h2>
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
                  <span className="text-xs font-semibold text-[#424656]">Email *</span>
                  <input required type="email" value={formData.email} disabled={!!editingUser}
                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    className={`h-9 px-3 border border-[#c2c6d8] rounded text-sm focus:outline-none focus:border-[#0866ff] focus:ring-1 focus:ring-[#0866ff] ${editingUser ? 'bg-[#f8f9ff] text-[#424656]' : 'bg-white'}`}
                    placeholder="email@company.com" />
                </label>
                {!editingUser && (
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[#424656]">Mật khẩu *</span>
                    <input required type="password" value={formData.password} minLength={6}
                      onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                      className="h-9 px-3 border border-[#c2c6d8] rounded text-sm bg-white focus:outline-none focus:border-[#0866ff] focus:ring-1 focus:ring-[#0866ff]"
                      placeholder="Tối thiểu 6 ký tự" />
                  </label>
                )}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#424656]">Số điện thoại</span>
                  <input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                    className="h-9 px-3 border border-[#c2c6d8] rounded text-sm bg-white focus:outline-none focus:border-[#0866ff] focus:ring-1 focus:ring-[#0866ff]"
                    placeholder="0901234567" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#424656]">Vai trò *</span>
                  <div className="relative">
                    <select required value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}
                      className="w-full h-9 pl-3 pr-8 border border-[#c2c6d8] rounded text-sm bg-white appearance-none focus:outline-none focus:border-[#0866ff]">
                      {ROLES.map((r: string) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#424656] text-sm">unfold_more</span>
                  </div>
                </label>
                <label className="flex flex-col gap-1 col-span-2">
                  <span className="text-xs font-semibold text-[#424656]">Địa chỉ</span>
                  <input value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                    className="h-9 px-3 border border-[#c2c6d8] rounded text-sm bg-white focus:outline-none focus:border-[#0866ff] focus:ring-1 focus:ring-[#0866ff]"
                    placeholder="Số nhà, đường, quận, thành phố" />
                </label>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="h-9 px-4 rounded border border-[#c2c6d8] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff] transition-colors">
                  Hủy
                </button>
                <button type="submit" disabled={submitting}
                  className="h-9 px-4 rounded bg-[#0866ff] hover:bg-[#1877f2] text-white text-xs font-semibold transition-all disabled:opacity-60 active:scale-[0.98]">
                  {submitting ? 'Đang lưu...' : (editingUser ? 'Cập nhật' : 'Tạo tài khoản')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#e5eeff]">
              <h2 className="text-base font-semibold text-[#0b1c30]">Đặt lại mật khẩu</h2>
              <button onClick={() => setShowResetModal(false)} className="w-7 h-7 rounded hover:bg-[#eff4ff] text-[#424656] flex items-center justify-center">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#424656]">Mật khẩu mới *</span>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="h-9 px-3 border border-[#c2c6d8] rounded text-sm bg-white focus:outline-none focus:border-[#0866ff] focus:ring-1 focus:ring-[#0866ff]"
                  placeholder="Tối thiểu 6 ký tự" />
              </label>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowResetModal(false)} className="h-9 px-4 rounded border border-[#c2c6d8] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff]">Hủy</button>
                <button onClick={handleResetPassword} disabled={submitting || newPassword.length < 6}
                  className="h-9 px-4 rounded bg-[#0866ff] hover:bg-[#1877f2] text-white text-xs font-semibold disabled:opacity-60">
                  {submitting ? 'Đang lưu...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
