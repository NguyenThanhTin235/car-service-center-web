'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { jobTypeApi, JobTypeData } from '@/lib/api/jobTypes';

interface FormData { name: string; description: string; hourlyRate: string; }
const defaultForm: FormData = { name: '', description: '', hourlyRate: '' };

export default function JobTypesPage() {
  const [jobTypes, setJobTypes] = useState<JobTypeData[]>([]);
  const [pagination, setPagination] = useState({ totalRecords: 0, totalPages: 1, currentPage: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<JobTypeData | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await jobTypeApi.getAll({ search, page, limit: 10 });
      setJobTypes(res.data.data); setPagination(res.data.pagination);
    } catch (e: any) { setError(e.response?.data?.message || 'Lỗi tải dữ liệu'); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setFormData(defaultForm); setError(''); setShowModal(true); };
  const openEdit = (j: JobTypeData) => {
    setEditing(j);
    setFormData({ name: j.name, description: j.description || '', hourlyRate: String(j.hourlyRate) });
    setError(''); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const payload = { name: formData.name, description: formData.description || undefined, hourlyRate: parseFloat(formData.hourlyRate) };
      editing ? await jobTypeApi.update(editing.id, payload) : await jobTypeApi.create(payload);
      setShowModal(false); load(pagination.currentPage);
    } catch (e: any) { setError(e.response?.data?.message || 'Có lỗi xảy ra'); } finally { setSubmitting(false); }
  };

  const handleToggle = async (j: JobTypeData) => {
    if (!confirm(`${j.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'} loại công việc "${j.name}"?`)) return;
    try { await jobTypeApi.toggle(j.id); load(pagination.currentPage); }
    catch (e: any) { alert(e.response?.data?.message || 'Có lỗi xảy ra'); }
  };

  const activeCount = jobTypes.filter(j => j.isActive).length;

  return (
    <div className="min-h-screen bg-[#f8f9ff] font-[Be_Vietnam_Pro,sans-serif] text-[#0b1c30]">
      <header className="fixed top-0 left-64 right-0 h-14 z-30 bg-white/90 backdrop-blur border-b border-[#c2c6d8]/30 flex items-center px-6">
        <div className="flex items-center gap-1 text-xs text-[#424656]">
          <span>Admin</span>
          <span className="material-symbols-outlined text-sm text-[#727687]">chevron_right</span>
          <span className="font-semibold text-[#0b1c30]">Loại công việc</span>
        </div>
      </header>

      <main className="pt-14 px-6 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-[#0b1c30] tracking-tight">Loại công việc</h1>
              <span className="px-2 py-0.5 rounded-full bg-[#e5eeff] text-[#0050cd] font-mono text-xs font-semibold">Job Type</span>
            </div>
            <p className="text-sm text-[#424656] mt-1">Cấu hình các loại công việc kỹ thuật và đơn giá theo giờ.</p>
          </div>
          <button onClick={openCreate} className="h-9 px-4 rounded bg-[#0866ff] hover:bg-[#1877f2] text-white flex items-center gap-2 text-xs font-semibold transition-all active:scale-[0.98] shadow-sm self-start">
            <span className="material-symbols-outlined text-lg">add</span>
            Thêm loại công việc
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Tổng loại CV', value: pagination.totalRecords, icon: 'work', color: 'text-[#0050cd]' },
            { label: 'Đang hoạt động', value: activeCount, icon: 'check_circle', color: 'text-[#10b981]' },
            { label: 'Vô hiệu hóa', value: pagination.totalRecords - activeCount, icon: 'cancel', color: 'text-[#ef4444]' },
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

        <div className="w-full rounded-xl bg-white shadow-sm border border-[#e5eeff] overflow-hidden">
          <div className="p-3 flex items-center gap-2 border-b border-[#e5eeff]">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#525970] text-lg">search</span>
              <input className="w-full h-9 pl-9 pr-4 rounded bg-[#eff4ff] text-[#0b1c30] placeholder:text-[#424656] text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0866ff] transition-all"
                placeholder="Tìm theo tên loại công việc..." value={search}
                onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(1)} />
            </div>
            <button onClick={() => load(1)} className="h-9 w-9 rounded bg-[#eff4ff] hover:bg-[#e5eeff] flex items-center justify-center text-[#424656]">
              <span className="material-symbols-outlined text-lg">sync</span>
            </button>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="h-9 bg-[#f8f9ff] text-[#424656] text-[11px] uppercase tracking-wider font-semibold border-b border-[#e5eeff]">
                  <th className="px-4 font-mono">ID</th>
                  <th className="px-4">Tên loại công việc</th>
                  <th className="px-4">Đơn giá / giờ</th>
                  <th className="px-4 text-right pr-6">Trạng thái & Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {loading ? (
                  <tr><td colSpan={4} className="py-12 text-center text-sm text-[#424656]">Đang tải...</td></tr>
                ) : jobTypes.length === 0 ? (
                  <tr><td colSpan={4} className="py-12 text-center text-sm text-[#424656]">Không tìm thấy loại công việc</td></tr>
                ) : jobTypes.map(j => (
                  <tr key={j.id} className={`h-14 hover:bg-[#f8f9ff]/40 transition-colors ${!j.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-4 font-mono text-xs font-medium text-[#0050cd]">JT-{String(j.id).padStart(3, '0')}</td>
                    <td className="px-4">
                      <div className="text-xs font-semibold text-[#0b1c30]">{j.name}</div>
                      {j.description && <div className="text-[10px] text-[#727687] truncate max-w-[300px]">{j.description}</div>}
                    </td>
                    <td className="px-4 font-mono text-xs text-[#0b1c30] font-semibold">
                      {Number(j.hourlyRate).toLocaleString('vi-VN')} ₫/h
                    </td>
                    <td className="px-4 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${j.isActive ? 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]' : 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]'}`}>
                          {j.isActive ? 'Hoạt động' : 'Vô hiệu'}
                        </span>
                        <button onClick={() => openEdit(j)} className="w-7 h-7 rounded hover:bg-[#e5eeff] text-[#424656] flex items-center justify-center" title="Chỉnh sửa">
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button onClick={() => handleToggle(j)} className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${j.isActive ? 'bg-[#fef2f2] hover:bg-[#ef4444] hover:text-white text-[#ef4444]' : 'bg-[#ecfdf5] hover:bg-[#10b981] hover:text-white text-[#10b981]'}`}>
                          <span className="material-symbols-outlined text-base">{j.isActive ? 'toggle_off' : 'toggle_on'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 flex items-center justify-between border-t border-[#e5eeff]">
            <span className="text-xs text-[#424656]">Tổng <span className="font-semibold text-[#0b1c30]">{pagination.totalRecords}</span> loại công việc</span>
            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => load(p)} className={`w-8 h-8 rounded font-mono text-xs font-semibold ${p === pagination.currentPage ? 'bg-[#0866ff] text-white' : 'bg-[#eff4ff] text-[#0b1c30]'}`}>{p}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#e5eeff]">
              <h2 className="text-base font-semibold text-[#0b1c30]">{editing ? 'Cập nhật loại công việc' : 'Thêm loại công việc'}</h2>
              <button onClick={() => setShowModal(false)} className="w-7 h-7 rounded hover:bg-[#eff4ff] text-[#424656] flex items-center justify-center">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && <div className="p-3 rounded bg-[#fef2f2] text-[#dc2626] text-xs border border-[#fecaca]">{error}</div>}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#424656]">Tên loại công việc *</span>
                <input required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="h-9 px-3 border border-[#c2c6d8] rounded text-sm focus:outline-none focus:border-[#0866ff]"
                  placeholder="VD: Thay dầu, Kiểm tra phanh..." />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#424656]">Đơn giá / giờ (VNĐ) *</span>
                <input required type="number" min="0" value={formData.hourlyRate} onChange={e => setFormData(p => ({ ...p, hourlyRate: e.target.value }))}
                  className="h-9 px-3 border border-[#c2c6d8] rounded text-sm focus:outline-none focus:border-[#0866ff]"
                  placeholder="150000" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#424656]">Mô tả</span>
                <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="px-3 py-2 border border-[#c2c6d8] rounded text-sm focus:outline-none focus:border-[#0866ff] resize-none" rows={2}
                  placeholder="Mô tả loại công việc (tùy chọn)" />
              </label>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="h-9 px-4 rounded border border-[#c2c6d8] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff]">Hủy</button>
                <button type="submit" disabled={submitting} className="h-9 px-4 rounded bg-[#0866ff] hover:bg-[#1877f2] text-white text-xs font-semibold disabled:opacity-60">
                  {submitting ? 'Đang lưu...' : (editing ? 'Cập nhật' : 'Tạo mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
