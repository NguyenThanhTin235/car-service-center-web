'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { serviceTemplateApi, ServiceTemplateData, CategoryData } from '@/lib/api/serviceTemplates';

const PRICING_TYPE_LABELS: Record<string, string> = { FIXED: 'Giá cố định', VEHICLE_SIZE: 'Theo cỡ xe', LABOUR_PARTS: 'Công + Vật tư' };
const PRICING_COLORS: Record<string, string> = { FIXED: 'bg-[#eff6ff] text-[#1d4ed8]', VEHICLE_SIZE: 'bg-[#fffbeb] text-[#92400e]', LABOUR_PARTS: 'bg-[#ecfdf5] text-[#065f46]' };
const VEHICLE_SIZES = ['SMALL', 'MEDIUM', 'LARGE', 'SUV', 'TRUCK'];
const SIZE_LABELS: Record<string, string> = { SMALL: 'Nhỏ', MEDIUM: 'Vừa', LARGE: 'Lớn', SUV: 'SUV', TRUCK: 'Tải' };

interface FormData {
  categoryId: string;
  name: string;
  description: string;
  pricingType: string;
  fixedPrice: string;
  sizePrices: Record<string, string>;
}

const defaultForm: FormData = { categoryId: '', name: '', description: '', pricingType: 'FIXED', fixedPrice: '', sizePrices: {} };

export default function ServicesPage() {
  const [templates, setTemplates] = useState<ServiceTemplateData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [pagination, setPagination] = useState({ totalRecords: 0, totalPages: 1, currentPage: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ServiceTemplateData | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await serviceTemplateApi.getAll({ search, categoryId: filterCat ? parseInt(filterCat) : undefined, page, limit: 10 });
      setTemplates(res.data.data); setPagination(res.data.pagination);
    } catch (e: any) { setError(e.response?.data?.message || 'Lỗi tải dữ liệu'); } finally { setLoading(false); }
  }, [search, filterCat]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { serviceTemplateApi.getCategories().then(r => setCategories(r.data.data)).catch(() => {}); }, []);

  const openCreate = () => { setEditing(null); setFormData(defaultForm); setError(''); setShowModal(true); };
  const openEdit = (t: ServiceTemplateData) => {
    const sp: Record<string, string> = {};
    t.sizePrices.forEach(s => { sp[s.vehicleSize] = String(s.price); });
    setEditing(t);
    setFormData({ categoryId: String(t.category.id), name: t.name, description: t.description || '', pricingType: t.pricingType, fixedPrice: t.fixedPrice ? String(t.fixedPrice) : '', sizePrices: sp });
    setError(''); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const payload: any = {
        categoryId: parseInt(formData.categoryId),
        name: formData.name,
        description: formData.description || undefined,
        pricingType: formData.pricingType,
        fixedPrice: formData.pricingType === 'FIXED' && formData.fixedPrice ? parseFloat(formData.fixedPrice) : undefined,
        sizePrices: formData.pricingType === 'VEHICLE_SIZE'
          ? VEHICLE_SIZES.filter(s => formData.sizePrices[s]).map(s => ({ vehicleSize: s, price: parseFloat(formData.sizePrices[s]) }))
          : undefined,
      };
      editing ? await serviceTemplateApi.update(editing.id, payload) : await serviceTemplateApi.create(payload);
      setShowModal(false); load(pagination.currentPage);
    } catch (e: any) { setError(e.response?.data?.message || 'Có lỗi xảy ra'); } finally { setSubmitting(false); }
  };

  const handleToggle = async (t: ServiceTemplateData) => {
    if (!confirm(`${t.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'} dịch vụ "${t.name}"?`)) return;
    try { await serviceTemplateApi.toggle(t.id); load(pagination.currentPage); }
    catch (e: any) { alert(e.response?.data?.message || 'Có lỗi xảy ra'); }
  };

  const activeCount = templates.filter(t => t.isActive).length;

  return (
    <div className="min-h-screen bg-[#f8f9ff] font-[Be_Vietnam_Pro,sans-serif] text-[#0b1c30]">
      <header className="fixed top-0 left-64 right-0 h-14 z-30 bg-white/90 backdrop-blur border-b border-[#c2c6d8]/30 flex items-center justify-between px-6">
        <div className="flex items-center gap-1 text-xs text-[#424656]">
          <span>Admin</span>
          <span className="material-symbols-outlined text-sm text-[#727687]">chevron_right</span>
          <span>Danh mục</span>
          <span className="material-symbols-outlined text-sm text-[#727687]">chevron_right</span>
          <span className="font-semibold text-[#0b1c30]">Dịch vụ</span>
        </div>
      </header>

      <main className="pt-14 px-6 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-[#0b1c30] tracking-tight">Dịch vụ</h1>
              <span className="px-2 py-0.5 rounded-full bg-[#e5eeff] text-[#0050cd] font-mono text-xs font-semibold">Service</span>
            </div>
            <p className="text-sm text-[#424656] mt-1">Quản lý các dịch vụ, loại định giá và bảng giá theo cỡ xe.</p>
          </div>
          <button onClick={openCreate} className="h-9 px-4 rounded bg-[#0866ff] hover:bg-[#1877f2] text-white flex items-center gap-2 text-xs font-semibold transition-all active:scale-[0.98] shadow-sm self-start lg:self-center">
            <span className="material-symbols-outlined text-lg">add</span>
            Thêm dịch vụ
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Tổng dịch vụ', value: pagination.totalRecords, icon: 'build_circle', color: 'text-[#0050cd]' },
            { label: 'Đang hoạt động', value: activeCount, icon: 'check_circle', color: 'text-[#10b981]' },
            { label: 'Vô hiệu hóa', value: pagination.totalRecords - activeCount, icon: 'cancel', color: 'text-[#ef4444]' },
            { label: 'Danh mục dịch vụ', value: categories.length, icon: 'category', color: 'text-[#f59e0b]' },
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

        {/* Table */}
        <div className="w-full rounded-xl bg-white shadow-sm border border-[#e5eeff] overflow-hidden">
          <div className="p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border-b border-[#e5eeff]">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#525970] text-lg">search</span>
              <input className="w-full h-9 pl-9 pr-4 rounded bg-[#eff4ff] text-[#0b1c30] placeholder:text-[#424656] text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0866ff] transition-all"
                placeholder="Tìm theo tên dịch vụ..." value={search}
                onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(1)} />
            </div>
            <div className="relative w-full sm:w-48">
              <select className="w-full h-9 pl-3 pr-8 rounded bg-[#eff4ff] text-[#0b1c30] text-xs appearance-none focus:outline-none"
                value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="">Tất cả danh mục</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#424656] text-sm">unfold_more</span>
            </div>
            <button onClick={() => load(1)} className="h-9 w-9 rounded bg-[#eff4ff] hover:bg-[#e5eeff] flex items-center justify-center text-[#424656]">
              <span className="material-symbols-outlined text-lg">sync</span>
            </button>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="h-9 bg-[#f8f9ff] text-[#424656] text-[11px] uppercase tracking-wider font-semibold border-b border-[#e5eeff]">
                  <th className="px-4 font-mono">ID</th>
                  <th className="px-4">Tên dịch vụ</th>
                  <th className="px-4">Danh mục dịch vụ</th>
                  <th className="px-4">Loại giá</th>
                  <th className="px-4">Giá</th>
                  <th className="px-4 text-right pr-6">Trạng thái & Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {loading ? (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-[#424656]">Đang tải...</td></tr>
                ) : templates.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-[#424656]">Không tìm thấy dịch vụ phù hợp</td></tr>
                ) : templates.map(t => (
                  <tr key={t.id} className={`h-14 hover:bg-[#f8f9ff]/40 transition-colors ${!t.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-4 font-mono text-xs font-medium text-[#0050cd]">SVC-{String(t.id).padStart(4, '0')}</td>
                    <td className="px-4">
                      <div className="text-xs font-semibold text-[#0b1c30]">{t.name}</div>
                      {t.description && <div className="text-[10px] text-[#727687] truncate max-w-[200px]">{t.description}</div>}
                    </td>
                    <td className="px-4">
                      <span className="px-2 py-0.5 rounded-full bg-[#f8f9ff] border border-[#e5eeff] text-[10px] font-medium text-[#424656]">{t.category.name}</span>
                    </td>
                    <td className="px-4">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${PRICING_COLORS[t.pricingType] || ''}`}>
                        {PRICING_TYPE_LABELS[t.pricingType] || t.pricingType}
                      </span>
                    </td>
                    <td className="px-4 font-mono text-xs text-[#0b1c30]">
                      {t.pricingType === 'FIXED' && t.fixedPrice
                        ? `${Number(t.fixedPrice).toLocaleString('vi-VN')} ₫`
                        : t.pricingType === 'VEHICLE_SIZE'
                        ? `${t.sizePrices.length} mức giá`
                        : 'Tính sau'}
                    </td>
                    <td className="px-4 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${t.isActive ? 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]' : 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]'}`}>
                          {t.isActive ? 'Hoạt động' : 'Vô hiệu'}
                        </span>
                        <button onClick={() => openEdit(t)} className="w-7 h-7 rounded hover:bg-[#e5eeff] text-[#424656] flex items-center justify-center transition-colors" title="Chỉnh sửa">
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button onClick={() => handleToggle(t)} className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${t.isActive ? 'bg-[#fef2f2] hover:bg-[#ef4444] hover:text-white text-[#ef4444]' : 'bg-[#ecfdf5] hover:bg-[#10b981] hover:text-white text-[#10b981]'}`}
                          title={t.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}>
                          <span className="material-symbols-outlined text-base">{t.isActive ? 'toggle_off' : 'toggle_on'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#e5eeff]">
            <span className="text-xs text-[#424656]">Hiển thị <span className="font-semibold text-[#0b1c30]">{templates.length}</span> trong <span className="font-semibold text-[#0b1c30]">{pagination.totalRecords}</span> dịch vụ</span>
            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => load(p)} className={`w-8 h-8 rounded font-mono text-xs font-semibold transition-colors ${p === pagination.currentPage ? 'bg-[#0866ff] text-white' : 'bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30]'}`}>{p}</button>
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
              <h2 className="text-base font-semibold text-[#0b1c30]">{editing ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'}</h2>
              <button onClick={() => setShowModal(false)} className="w-7 h-7 rounded hover:bg-[#eff4ff] text-[#424656] flex items-center justify-center">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && <div className="p-3 rounded bg-[#fef2f2] text-[#dc2626] text-xs border border-[#fecaca]">{error}</div>}

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#424656]">Tên dịch vụ *</span>
                <input required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="h-9 px-3 border border-[#c2c6d8] rounded text-sm bg-white focus:outline-none focus:border-[#0866ff]"
                  placeholder="Tên dịch vụ" />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#424656]">Danh mục dịch vụ *</span>
                  <div className="relative">
                    <select required value={formData.categoryId} onChange={e => setFormData(p => ({ ...p, categoryId: e.target.value }))}
                      className="w-full h-9 pl-3 pr-8 border border-[#c2c6d8] rounded text-sm bg-white appearance-none focus:outline-none focus:border-[#0866ff]">
                      <option value="">Chọn danh mục</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#424656] text-sm">unfold_more</span>
                  </div>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#424656]">Loại định giá *</span>
                  <div className="relative">
                    <select required value={formData.pricingType} onChange={e => setFormData(p => ({ ...p, pricingType: e.target.value, fixedPrice: '', sizePrices: {} }))}
                      className="w-full h-9 pl-3 pr-8 border border-[#c2c6d8] rounded text-sm bg-white appearance-none focus:outline-none focus:border-[#0866ff]">
                      {Object.entries(PRICING_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#424656] text-sm">unfold_more</span>
                  </div>
                </label>
              </div>

              {formData.pricingType === 'FIXED' && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#424656]">Giá cố định (VNĐ) *</span>
                  <input type="number" min="0" required value={formData.fixedPrice} onChange={e => setFormData(p => ({ ...p, fixedPrice: e.target.value }))}
                    className="h-9 px-3 border border-[#c2c6d8] rounded text-sm bg-white focus:outline-none focus:border-[#0866ff]"
                    placeholder="0" />
                </label>
              )}

              {formData.pricingType === 'VEHICLE_SIZE' && (
                <div>
                  <span className="text-xs font-semibold text-[#424656]">Giá theo cỡ xe</span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {VEHICLE_SIZES.map(size => (
                      <label key={size} className="flex flex-col gap-1">
                        <span className="text-[10px] text-[#424656]">{SIZE_LABELS[size]}</span>
                        <input type="number" min="0" value={formData.sizePrices[size] || ''}
                          onChange={e => setFormData(p => ({ ...p, sizePrices: { ...p.sizePrices, [size]: e.target.value } }))}
                          className="h-8 px-2 border border-[#c2c6d8] rounded text-xs bg-white focus:outline-none focus:border-[#0866ff]"
                          placeholder="0 ₫" />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#424656]">Mô tả</span>
                <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="px-3 py-2 border border-[#c2c6d8] rounded text-sm bg-white focus:outline-none focus:border-[#0866ff] resize-none" rows={2}
                  placeholder="Mô tả dịch vụ (tùy chọn)" />
              </label>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="h-9 px-4 rounded border border-[#c2c6d8] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff]">Hủy</button>
                <button type="submit" disabled={submitting} className="h-9 px-4 rounded bg-[#0866ff] hover:bg-[#1877f2] text-white text-xs font-semibold disabled:opacity-60">
                  {submitting ? 'Đang lưu...' : (editing ? 'Cập nhật' : 'Tạo dịch vụ')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
