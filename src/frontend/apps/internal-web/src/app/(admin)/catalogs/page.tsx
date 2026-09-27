'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { catalogApi, CatalogData } from '@/lib/api/catalogs';

const CATALOG_TYPES: Record<string, string> = { UOM: 'Đơn vị đo lường', CANCEL_REASON: 'Lý do hủy', ADJUST_REASON: 'Lý do điều chỉnh', TERMS: 'Điều khoản' };
const TYPE_COLOR: Record<string, string> = { UOM: 'bg-[#eff6ff] text-[#1d4ed8]', CANCEL_REASON: 'bg-[#fef2f2] text-[#b91c1c]', ADJUST_REASON: 'bg-[#fffbeb] text-[#92400e]', TERMS: 'bg-[#ecfdf5] text-[#065f46]' };

interface FormData { catalogType: string; name: string; description: string; sortOrder: string; }
const defaultForm: FormData = { catalogType: 'UOM', name: '', description: '', sortOrder: '0' };

export default function CatalogsPage() {
  const [catalogs, setCatalogs] = useState<CatalogData[]>([]);
  const [pagination, setPagination] = useState({ totalRecords: 0, totalPages: 1, currentPage: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CatalogData | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await catalogApi.getAll({ search, catalogType: filterType || undefined, page, limit: 10 });
      setCatalogs(res.data.data); setPagination(res.data.pagination);
    } catch (e: any) { setError(e.response?.data?.message || 'Lỗi tải dữ liệu'); } finally { setLoading(false); }
  }, [search, filterType]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setFormData(defaultForm); setError(''); setShowModal(true); };
  const openEdit = (c: CatalogData) => {
    setEditing(c);
    setFormData({ catalogType: c.catalogType, name: c.name, description: c.description || '', sortOrder: String(c.sortOrder) });
    setError(''); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const payload = { catalogType: formData.catalogType, name: formData.name, description: formData.description || undefined, sortOrder: parseInt(formData.sortOrder) || 0 };
      editing ? await catalogApi.update(editing.id, payload) : await catalogApi.create(payload);
      setShowModal(false); load(pagination.currentPage);
    } catch (e: any) { setError(e.response?.data?.message || 'Có lỗi xảy ra'); } finally { setSubmitting(false); }
  };

  const handleToggle = async (c: CatalogData) => {
    if (!confirm(`${c.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'} danh mục "${c.name}"?`)) return;
    try { await catalogApi.toggle(c.id); load(pagination.currentPage); }
    catch (e: any) { alert(e.response?.data?.message || 'Có lỗi xảy ra'); }
  };

  const activeCount = catalogs.filter(c => c.isActive).length;

  return (
    <div className="min-h-screen bg-[#f8f9ff] font-[Be_Vietnam_Pro,sans-serif] text-[#0b1c30]">
      <header className="fixed top-0 left-64 right-0 h-14 z-30 bg-white/90 backdrop-blur border-b border-[#c2c6d8]/30 flex items-center px-6">
        <div className="flex items-center gap-1 text-xs text-[#424656]">
          <span>Admin</span>
          <span className="material-symbols-outlined text-sm text-[#727687]">chevron_right</span>
          <span className="font-semibold text-[#0b1c30]">Danh mục chung</span>
        </div>
      </header>

      <main className="pt-14 px-6 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-[#0b1c30] tracking-tight">Danh mục chung</h1>
              <span className="px-2 py-0.5 rounded-full bg-[#e5eeff] text-[#0050cd] font-mono text-xs font-semibold">System Catalog</span>
            </div>
            <p className="text-sm text-[#424656] mt-1">Quản lý các danh mục dữ liệu hệ thống: đơn vị đo, lý do hủy, điều chỉnh, điều khoản.</p>
          </div>
          <button onClick={openCreate} className="h-9 px-4 rounded bg-[#0866ff] hover:bg-[#1877f2] text-white flex items-center gap-2 text-xs font-semibold transition-all active:scale-[0.98] shadow-sm self-start">
            <span className="material-symbols-outlined text-lg">add</span>
            Thêm danh mục
          </button>
        </div>

        {/* Stats by type */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(CATALOG_TYPES).map(([type, label]) => (
            <div key={type} className="p-4 rounded-xl bg-white shadow-sm border border-[#e5eeff] flex flex-col gap-1 cursor-pointer hover:border-[#0866ff]/30 transition-colors"
              onClick={() => setFilterType(filterType === type ? '' : type)}>
              <span className="text-[10px] text-[#424656] uppercase tracking-wider font-semibold">{label}</span>
              <span className={`self-start px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold mt-1 ${TYPE_COLOR[type]}`}>{type}</span>
            </div>
          ))}
        </div>

        <div className="w-full rounded-xl bg-white shadow-sm border border-[#e5eeff] overflow-hidden">
          <div className="p-3 flex items-center gap-2 border-b border-[#e5eeff]">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#525970] text-lg">search</span>
              <input className="w-full h-9 pl-9 pr-4 rounded bg-[#eff4ff] text-[#0b1c30] placeholder:text-[#424656] text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0866ff] transition-all"
                placeholder="Tìm theo tên danh mục..." value={search}
                onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(1)} />
            </div>
            <div className="relative w-48">
              <select className="w-full h-9 pl-3 pr-8 rounded bg-[#eff4ff] text-[#0b1c30] text-xs appearance-none focus:outline-none"
                value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="">Tất cả loại</option>
                {Object.entries(CATALOG_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#424656] text-sm">unfold_more</span>
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
                  <th className="px-4">Tên danh mục</th>
                  <th className="px-4">Loại</th>
                  <th className="px-4">Thứ tự</th>
                  <th className="px-4 text-right pr-6">Trạng thái & Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {loading ? (
                  <tr><td colSpan={5} className="py-12 text-center text-sm text-[#424656]">Đang tải...</td></tr>
                ) : catalogs.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-sm text-[#424656]">Không tìm thấy danh mục phù hợp</td></tr>
                ) : catalogs.map(c => (
                  <tr key={c.id} className={`h-14 hover:bg-[#f8f9ff]/40 transition-colors ${!c.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-4 font-mono text-xs font-medium text-[#0050cd]">CAT-{String(c.id).padStart(4, '0')}</td>
                    <td className="px-4">
                      <div className="text-xs font-semibold text-[#0b1c30]">{c.name}</div>
                      {c.description && <div className="text-[10px] text-[#727687] truncate max-w-[250px]">{c.description}</div>}
                    </td>
                    <td className="px-4">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${TYPE_COLOR[c.catalogType] || ''}`}>
                        {CATALOG_TYPES[c.catalogType] || c.catalogType}
                      </span>
                    </td>
                    <td className="px-4 font-mono text-xs text-[#424656]">{c.sortOrder}</td>
                    <td className="px-4 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${c.isActive ? 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]' : 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]'}`}>
                          {c.isActive ? 'Hoạt động' : 'Vô hiệu'}
                        </span>
                        <button onClick={() => openEdit(c)} className="w-7 h-7 rounded hover:bg-[#e5eeff] text-[#424656] flex items-center justify-center" title="Chỉnh sửa">
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button onClick={() => handleToggle(c)} className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${c.isActive ? 'bg-[#fef2f2] hover:bg-[#ef4444] hover:text-white text-[#ef4444]' : 'bg-[#ecfdf5] hover:bg-[#10b981] hover:text-white text-[#10b981]'}`}>
                          <span className="material-symbols-outlined text-base">{c.isActive ? 'toggle_off' : 'toggle_on'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 flex items-center justify-between border-t border-[#e5eeff]">
            <span className="text-xs text-[#424656]">Tổng <span className="font-semibold text-[#0b1c30]">{pagination.totalRecords}</span> danh mục</span>
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
              <h2 className="text-base font-semibold text-[#0b1c30]">{editing ? 'Cập nhật danh mục' : 'Thêm danh mục chung'}</h2>
              <button onClick={() => setShowModal(false)} className="w-7 h-7 rounded hover:bg-[#eff4ff] text-[#424656] flex items-center justify-center">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && <div className="p-3 rounded bg-[#fef2f2] text-[#dc2626] text-xs border border-[#fecaca]">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#424656]">Loại danh mục *</span>
                  <div className="relative">
                    <select required value={formData.catalogType} onChange={e => setFormData(p => ({ ...p, catalogType: e.target.value }))}
                      disabled={!!editing}
                      className="w-full h-9 pl-3 pr-8 border border-[#c2c6d8] rounded text-sm bg-white appearance-none focus:outline-none focus:border-[#0866ff] disabled:bg-[#f8f9ff]">
                      {Object.entries(CATALOG_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#424656] text-sm">unfold_more</span>
                  </div>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#424656]">Thứ tự hiển thị</span>
                  <input type="number" min="0" value={formData.sortOrder} onChange={e => setFormData(p => ({ ...p, sortOrder: e.target.value }))}
                    className="h-9 px-3 border border-[#c2c6d8] rounded text-sm focus:outline-none focus:border-[#0866ff]" />
                </label>
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#424656]">Tên danh mục *</span>
                <input required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="h-9 px-3 border border-[#c2c6d8] rounded text-sm focus:outline-none focus:border-[#0866ff]"
                  placeholder="VD: Cái, Bộ, Mét, ..." />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#424656]">Mô tả</span>
                <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="px-3 py-2 border border-[#c2c6d8] rounded text-sm focus:outline-none focus:border-[#0866ff] resize-none" rows={2}
                  placeholder="Mô tả (tùy chọn)" />
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
