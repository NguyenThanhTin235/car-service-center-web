'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { serviceTemplateApi, ServiceTemplateData, CategoryData } from '@/lib/api/serviceTemplates';
import ConfirmModal from '@/components/shared/ConfirmModal';
import toast from 'react-hot-toast';

const PRICING_TYPE_LABELS: Record<string, string> = { FIXED: 'Giá cố định', VEHICLE_SIZE: 'Theo cỡ xe', LABOUR_PARTS: 'Công + Vật tư' };
const PRICING_COLORS: Record<string, string> = {
  FIXED: 'bg-blue-50 text-[#0050cd] border border-blue-200/80',
  VEHICLE_SIZE: 'bg-amber-50 text-amber-800 border border-amber-200/80',
  LABOUR_PARTS: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
};
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
  const [confirmItem, setConfirmItem] = useState<ServiceTemplateData | null>(null);
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

  const handleToggle = (t: ServiceTemplateData) => {
    setConfirmItem(t);
  };

  const handleConfirmToggle = async () => {
    if (!confirmItem) return;
    try {
      await serviceTemplateApi.toggle(confirmItem.id);
      toast.success(confirmItem.isActive ? `Đã vô hiệu hóa dịch vụ "${confirmItem.name}"` : `Đã kích hoạt dịch vụ "${confirmItem.name}"`);
      load(pagination.currentPage);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setConfirmItem(null);
    }
  };

  const activeCount = templates.filter(t => t.isActive).length;

  return (
    <div className="space-y-6 text-slate-900">
      {/* 1. SaaS Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
          Danh sách Dịch vụ
        </h1>
        <button
          onClick={openCreate}
          className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:brightness-110 text-white flex items-center gap-2 text-xs font-bold transition-all active:scale-[0.98] shadow-md shadow-[#0866ff]/20 self-start lg:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Thêm dịch vụ</span>
        </button>
      </div>

      {/* 2. Asymmetrical 12-Col Bento Summary (5 + 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Hero Card (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl saas-hero-gradient text-white p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 saas-subtle-grid pointer-events-none" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-blue-100/90">Tổng gói dịch vụ hệ thống</span>
              <div className="text-3xl font-mono font-extrabold tabular-nums tracking-tight mt-1">
                {pagination.totalRecords}{' '}
                <span className="text-sm font-sans font-medium text-blue-100/80">dịch vụ</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-xs">
              <span className="material-symbols-outlined text-[22px] text-white">build_circle</span>
            </div>
          </div>
          <div className="relative z-10 mt-4 pt-3.5 border-t border-white/15 flex items-center justify-between text-xs text-blue-50">
            <span>Nhóm danh mục dịch vụ</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/15 font-mono font-semibold">
              {categories.length} nhóm
            </span>
          </div>
        </div>

        {/* 3 Status Tiles (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="saas-card p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Đang hoạt động</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
              </div>
            </div>
            <div className="text-2xl font-mono font-extrabold tabular-nums text-slate-900 mt-2">
              {activeCount}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium mt-1">Đang mở báo giá</span>
          </div>

          <div className="saas-card p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Vô hiệu hóa</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200/60 text-rose-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">cancel</span>
              </div>
            </div>
            <div className="text-2xl font-mono font-extrabold tabular-nums text-slate-900 mt-2">
              {Math.max(0, pagination.totalRecords - activeCount)}
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-1">Ngừng cung cấp</span>
          </div>

          <div className="saas-card p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Danh mục dịch vụ</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">category</span>
              </div>
            </div>
            <div className="text-2xl font-mono font-extrabold tabular-nums text-slate-900 mt-2">
              {categories.length}
            </div>
            <span className="text-[11px] text-amber-700 font-medium mt-1">Nhóm phân loại</span>
          </div>
        </div>
      </div>

      {/* 3. Table */}
      <div className="w-full saas-card overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200/80">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                className="w-full h-9 pl-9 pr-4 rounded-xl bg-slate-50/80 border border-slate-200/80 text-slate-800 placeholder:text-slate-400 text-xs focus:outline-none focus:bg-white focus:border-[#0866ff] focus:ring-2 focus:ring-[#0866ff]/15 transition-all"
                placeholder="Tìm theo tên dịch vụ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && load(1)}
              />
            </div>
            <div className="relative w-full sm:w-52">
              <select
                className="w-full h-9 pl-3 pr-8 rounded-xl bg-slate-50/80 border border-slate-200/80 text-slate-700 font-semibold text-xs appearance-none focus:outline-none focus:border-[#0866ff] cursor-pointer"
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[16px]">
                unfold_more
              </span>
            </div>
          </div>
          <button
            onClick={() => load(1)}
            className="h-9 px-3.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0866ff] transition-colors cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin text-[#0866ff]' : ''}`}>
              sync
            </span>
            <span>Làm mới</span>
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[820px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200/80">
                <th className="py-3.5 px-5 font-mono">ID</th>
                <th className="py-3.5 px-5">Tên dịch vụ</th>
                <th className="py-3.5 px-5">Danh mục dịch vụ</th>
                <th className="py-3.5 px-5">Loại giá</th>
                <th className="py-3.5 px-5">Đơn giá</th>
                <th className="py-3.5 px-5 text-right pr-6">Trạng thái &amp; Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    Đang tải danh sách dịch vụ...
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    Không tìm thấy dịch vụ phù hợp
                  </td>
                </tr>
              ) : (
                templates.map((t) => (
                  <tr
                    key={t.id}
                    className={`hover:bg-blue-50/25 transition-colors ${
                      !t.isActive ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="py-3.5 px-5 font-mono text-xs font-bold text-[#0866ff]">
                      SVC-{String(t.id).padStart(4, '0')}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                      {t.description && (
                        <div className="text-xs text-slate-400 truncate max-w-[240px]">
                          {t.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200/80 text-xs font-medium text-slate-700">
                        {t.category.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                          PRICING_COLORS[t.pricingType] || ''
                        }`}
                      >
                        {PRICING_TYPE_LABELS[t.pricingType] || t.pricingType}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-mono tabular-nums text-xs font-bold text-slate-900">
                      {t.pricingType === 'FIXED' && t.fixedPrice
                        ? `${Number(t.fixedPrice).toLocaleString('vi-VN')} ₫`
                        : t.pricingType === 'VEHICLE_SIZE'
                        ? `${t.sizePrices.length} mức giá`
                        : 'Tính sau'}
                    </td>
                    <td className="py-3.5 px-5 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            t.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                              : 'bg-rose-50 text-rose-700 border-rose-200/80'
                          }`}
                        >
                          {t.isActive ? 'Hoạt động' : 'Vô hiệu'}
                        </span>
                        <button
                          onClick={() => openEdit(t)}
                          className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 text-[#0866ff] flex items-center justify-center transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <span className="material-symbols-outlined text-[17px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleToggle(t)}
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                            t.isActive
                              ? 'bg-rose-50 hover:bg-rose-500 hover:text-white border-rose-200/80 text-rose-600'
                              : 'bg-emerald-50 hover:bg-emerald-500 hover:text-white border-emerald-200/80 text-emerald-600'
                          }`}
                          title={t.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {t.isActive ? 'toggle_off' : 'toggle_on'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80 bg-slate-50/40">
          <span className="text-xs text-slate-500">
            Hiển thị <span className="font-mono font-bold text-slate-700">{templates.length}</span>{' '}
            trong <span className="font-mono font-bold text-slate-700">{pagination.totalRecords}</span>{' '}
            dịch vụ
          </span>
          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => load(p)}
                  className={`w-8 h-8 rounded-lg font-mono text-xs font-semibold transition-colors cursor-pointer ${
                    p === pagination.currentPage
                      ? 'bg-[#0866ff] text-white'
                      : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {p}
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
                {editing ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'}
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

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Tên dịch vụ *</span>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0866ff]"
                  placeholder="Tên dịch vụ"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">Danh mục dịch vụ *</span>
                  <div className="relative">
                    <select
                      required
                      value={formData.categoryId}
                      onChange={(e) => setFormData((p) => ({ ...p, categoryId: e.target.value }))}
                      className="w-full h-10 pl-3 pr-8 border border-slate-200 rounded-xl text-sm bg-slate-50/50 appearance-none focus:bg-white focus:outline-none focus:border-[#0866ff]"
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-sm">
                      unfold_more
                    </span>
                  </div>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">Loại định giá *</span>
                  <div className="relative">
                    <select
                      required
                      value={formData.pricingType}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          pricingType: e.target.value,
                          fixedPrice: '',
                          sizePrices: {},
                        }))
                      }
                      className="w-full h-10 pl-3 pr-8 border border-slate-200 rounded-xl text-sm bg-slate-50/50 appearance-none focus:bg-white focus:outline-none focus:border-[#0866ff]"
                    >
                      {Object.entries(PRICING_TYPE_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-sm">
                      unfold_more
                    </span>
                  </div>
                </label>
              </div>

              {formData.pricingType === 'FIXED' && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">Giá cố định (VNĐ) *</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.fixedPrice}
                    onChange={(e) => setFormData((p) => ({ ...p, fixedPrice: e.target.value }))}
                    className="h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0866ff]"
                    placeholder="0"
                  />
                </label>
              )}

              {formData.pricingType === 'VEHICLE_SIZE' && (
                <div>
                  <span className="text-xs font-semibold text-slate-600">Giá theo cỡ xe</span>
                  <div className="mt-2 grid grid-cols-2 gap-2.5">
                    {VEHICLE_SIZES.map((size) => (
                      <label key={size} className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium text-slate-500">
                          {SIZE_LABELS[size]}
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={formData.sizePrices[size] || ''}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              sizePrices: { ...p.sizePrices, [size]: e.target.value },
                            }))
                          }
                          className="h-9 px-3 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0866ff]"
                          placeholder="0 ₫"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Mô tả</span>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0866ff] resize-none"
                  rows={2}
                  placeholder="Mô tả dịch vụ (tùy chọn)"
                />
              </label>

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
                  className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#0866ff] to-[#0050cd] text-white text-xs font-bold disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo dịch vụ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
          <ConfirmModal
        isOpen={!!confirmItem}
        title={confirmItem?.isActive ? 'Vô hiệu hóa dịch vụ' : 'Kích hoạt dịch vụ'}
        message={confirmItem ? `Bạn có chắc chắn muốn ${confirmItem.isActive ? 'vô hiệu hóa' : 'kích hoạt'} dịch vụ "${confirmItem.name}" không?` : ''}
        confirmText={confirmItem?.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
        isDestructive={confirmItem?.isActive}
        onConfirm={handleConfirmToggle}
        onCancel={() => setConfirmItem(null)}
      />
    </div>
  );
}
