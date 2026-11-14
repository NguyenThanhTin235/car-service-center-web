'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { serviceTemplateApi, ServiceTemplateData, CategoryData } from '@/lib/api/serviceTemplates';
import ConfirmModal from '@/components/shared/ConfirmModal';
import Modal from '@/components/shared/Modal';
import TablePagination from '@/components/shared/TablePagination';
import toast from 'react-hot-toast';
import { validateName, validateRequired, validatePrice } from '@/lib/utils/validators';

const PRICING_TYPE_LABELS: Record<string, string> = { FIXED: 'Giá cố định', VEHICLE_SIZE: 'Theo cỡ xe', LABOUR_PARTS: 'Công + Vật tư' };
const PRICING_COLORS: Record<string, string> = {
  FIXED: 'bg-blue-50 text-[#0050cd] border border-blue-200/80',
  VEHICLE_SIZE: 'bg-amber-50 text-amber-800 border border-amber-200/80',
  LABOUR_PARTS: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
};
const VEHICLE_SIZES = ['SMALL', 'MEDIUM', 'LARGE', 'SUV', 'TRUCK'];
const SIZE_LABELS: Record<string, string> = {
  SMALL: 'Xe nhỏ (S)',
  MEDIUM: 'Xe vừa (M)',
  LARGE: 'Xe lớn (L)',
  SUV: 'Xe rất lớn / SUV (XL)',
  TRUCK: 'Xe tải (Truck)',
};

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
  const [deleteItem, setDeleteItem] = useState<ServiceTemplateData | null>(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await serviceTemplateApi.getAll({ search, categoryId: filterCat ? parseInt(filterCat) : undefined, page, limit: 10 });
      setTemplates(res.data.data); setPagination(res.data.pagination);
    } catch (e: any) { setError(e.response?.data?.message || 'Lỗi tải dữ liệu'); } finally { setLoading(false); }
  }, [search, filterCat]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { serviceTemplateApi.getCategories().then(r => setCategories(r.data.data)).catch(() => {}); }, []);

  const openCreate = () => { setEditing(null); setFormData(defaultForm); setError(''); setFieldErrors({}); setShowModal(true); };
  const openEdit = (t: ServiceTemplateData) => {
    const sp: Record<string, string> = {};
    (t.sizePrices || []).forEach(s => { sp[s.vehicleSize] = String(s.price); });
    setEditing(t);
    setFormData({ categoryId: String(t.category.id), name: t.name, description: t.description || '', pricingType: t.pricingType, fixedPrice: t.fixedPrice ? String(t.fixedPrice) : '', sizePrices: sp });
    setError(''); setFieldErrors({}); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const nameErr = validateName(formData.name, 'Tên dịch vụ', 2, 150);
    if (nameErr) errors.name = nameErr;

    const catErr = validateRequired(formData.categoryId, 'Danh mục dịch vụ');
    if (catErr) errors.categoryId = catErr;

    if (formData.pricingType === 'FIXED') {
      const pVal = formData.fixedPrice !== undefined && formData.fixedPrice !== null ? String(formData.fixedPrice).trim() : '';
      const pNum = Number(pVal);
      if (!pVal || isNaN(pNum) || pNum <= 0) {
        errors.fixedPrice = 'Đơn giá cố định phải là số lớn hơn 0.';
      } else {
        const pErr = validatePrice(pVal, 'Đơn giá cố định', false);
        if (pErr) errors.fixedPrice = pErr;
      }
    } else if (formData.pricingType === 'VEHICLE_SIZE') {
      const enteredSizes = VEHICLE_SIZES.filter(
        (s) => formData.sizePrices[s] !== undefined && formData.sizePrices[s].trim() !== ''
      );
      if (enteredSizes.length === 0) {
        errors.sizePrices = 'Vui lòng nhập đơn giá cho ít nhất một cỡ xe';
      } else {
        for (const s of enteredSizes) {
          const sErr = validatePrice(formData.sizePrices[s], `Giá ${SIZE_LABELS[s] || s}`, false);
          if (sErr) errors[`size_${s}`] = sErr;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setError('');
    setFieldErrors({});
    try {
      const payload: any = {
        categoryId: parseInt(formData.categoryId),
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        pricingType: formData.pricingType,
        fixedPrice: formData.pricingType === 'FIXED' && formData.fixedPrice ? parseFloat(formData.fixedPrice) : undefined,
        sizePrices: formData.pricingType === 'VEHICLE_SIZE'
          ? VEHICLE_SIZES.filter(s => formData.sizePrices[s]).map(s => ({ vehicleSize: s, price: parseFloat(formData.sizePrices[s]) }))
          : undefined,
      };
      if (editing) {
        await serviceTemplateApi.update(editing.id, payload);
        toast.success('Cập nhật dịch vụ thành công.');
      } else {
        await serviceTemplateApi.create(payload);
        toast.success('Thêm dịch vụ mới thành công.');
      }
      setShowModal(false);
      load(pagination.currentPage);
    } catch (e: any) {
      const errMsg = e.response?.data?.message || 'Có lỗi xảy ra';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
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

  const handleDelete = (t: ServiceTemplateData) => {
    setDeleteItem(t);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    try {
      const res = await serviceTemplateApi.delete(deleteItem.id);
      const data = res.data;
      if (data?.deleted) {
        toast.success(data?.message || 'Đã xóa dịch vụ thành công');
      } else {
        toast.error(
          data?.message ||
            'Không thể xóa dịch vụ này vì đã có lịch sử sửa chữa của khách hàng tham chiếu. Hệ thống sẽ chuyển dịch vụ sang trạng thái Ngừng cung cấp để bảo toàn lịch sử.',
          { duration: 6000 }
        );
      }
      load(pagination.currentPage);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra khi xóa dịch vụ');
    } finally {
      setDeleteItem(null);
    }
  };

  const activeCount = templates.filter(t => t.isActive).length;

  return (
    <div className="space-y-6 text-slate-900">
      {/* 1. Asymmetrical 12-Col Bento Summary (5 + 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Navy (#0c2340) - Tổng gói dịch vụ */}
        <div className="lg:col-span-5 rounded-[24px] bg-[#0c2340] text-white p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between min-h-[170px] shadow-md hover:shadow-lg transition-all group">
          <div className="absolute inset-0 saas-subtle-grid pointer-events-none opacity-40" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-300 tracking-wide">Tổng gói dịch vụ hệ thống</span>
              <div className="text-3xl sm:text-4xl font-mono font-extrabold tabular-nums tracking-tight text-white mt-1.5">
                {pagination.totalRecords}{' '}
                <span className="text-sm font-sans font-medium text-zinc-300">dịch vụ</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-xs text-zinc-300 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[22px]">build_circle</span>
            </div>
          </div>
          <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-300">
            <span>Nhóm danh mục dịch vụ</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 font-mono font-bold text-white">
              {categories.length} nhóm
            </span>
          </div>
        </div>

        {/* 3 Status Tiles (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 2: Royal Blue (#0050cd) - Đang cung cấp */}
          <div className="rounded-[24px] bg-[#0050cd] text-white p-5 flex flex-col justify-between shadow-md shadow-[#0050cd]/20 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-100 tracking-wide">Đang cung cấp</span>
              <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold tabular-nums text-white mt-2">
              {activeCount}
            </div>
            <div className="flex items-center justify-between text-[11px] text-blue-100 mt-2 pt-2 border-t border-white/15">
              <span>Đang mở báo giá</span>
              <span className="font-mono font-bold">100% SLA</span>
            </div>
          </div>

          {/* Card 3: Soft Cool Slate (#e4e7ec) - Ngừng cung cấp */}
          <div className="rounded-[24px] bg-[#e4e7ec] text-zinc-900 p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 tracking-wide">Ngừng cung cấp</span>
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-300 text-rose-600 flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[18px]">cancel</span>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold tabular-nums text-zinc-900 mt-2">
              {templates.length - activeCount}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-300/80">
              <span>Ngừng áp dụng</span>
              <span className="font-mono font-semibold text-rose-700">Tạm dừng</span>
            </div>
          </div>

          {/* Card 4: Midnight Indigo (#111827) - Danh mục dịch vụ */}
          <div className="rounded-[24px] bg-[#111827] text-white p-5 flex flex-col justify-between shadow-md hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 tracking-wide">Danh mục dịch vụ</span>
              <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 text-cyan-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">category</span>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold tabular-nums text-white mt-2">
              {categories.length}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-white/10">
              <span>Nhóm phân loại</span>
              <span className="font-mono font-bold text-cyan-400">Trực thuộc</span>
            </div>
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(1)}
              className="h-9 px-3.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0866ff] transition-colors cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin text-[#0866ff]' : ''}`}>
                sync
              </span>
              <span>Làm mới</span>
            </button>

            <button
              onClick={openCreate}
              className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:brightness-110 text-white flex items-center gap-1.5 text-xs font-bold transition-all active:scale-[0.98] shadow-sm shadow-[#0866ff]/20 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[17px]">add</span>
              <span>Thêm dịch vụ mới</span>
            </button>
          </div>
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
                <th className="py-3.5 px-5 text-right pr-6">Thao tác</th>
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
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          t.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                            : 'bg-rose-50 text-rose-700 border-rose-200/80'
                        }`}
                      >
                        {t.isActive ? 'Đang cung cấp' : 'Ngừng cung cấp'}
                      </span>
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
                        <button
                          onClick={() => handleDelete(t)}
                          className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-rose-500 hover:text-white border border-slate-200/80 hover:border-rose-500 text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                          title="Xóa dịch vụ"
                        >
                          <span className="material-symbols-outlined text-[17px]">delete</span>
                        </button>
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
          onPageChange={load}
          currentCount={templates.length}
          recordLabel="dịch vụ"
        />
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'}
        size="lg"
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, name: e.target.value }));
                    if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: '' }));
                  }}
                  className={`h-10 px-3 border rounded-xl text-sm transition-colors ${
                    fieldErrors.name
                      ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 ring-2 ring-rose-400/20'
                      : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0866ff]'
                  }`}
                  placeholder="Tên dịch vụ"
                />
                {fieldErrors.name && (
                  <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    <span>{fieldErrors.name}</span>
                  </p>
                )}
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">Danh mục dịch vụ *</span>
                  <div className="relative">
                    <select
                      required
                      value={formData.categoryId}
                      onChange={(e) => {
                        setFormData((p) => ({ ...p, categoryId: e.target.value }));
                        if (fieldErrors.categoryId) setFieldErrors((p) => ({ ...p, categoryId: '' }));
                      }}
                      className={`w-full h-10 pl-3 pr-8 border rounded-xl text-sm appearance-none transition-colors ${
                        fieldErrors.categoryId
                          ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 ring-2 ring-rose-400/20'
                          : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0866ff]'
                      }`}
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
                  {fieldErrors.categoryId && (
                    <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      <span>{fieldErrors.categoryId}</span>
                    </p>
                  )}
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
                  <span className="text-xs font-semibold text-slate-600">Đơn giá cố định (VNĐ) *</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="1000"
                      value={formData.fixedPrice}
                      onChange={(e) => {
                        setFormData((p) => ({ ...p, fixedPrice: e.target.value }));
                        if (fieldErrors.fixedPrice) {
                          setFieldErrors((p) => ({ ...p, fixedPrice: '' }));
                        }
                      }}
                      className={`w-full h-10 pl-3 pr-8 border rounded-xl text-sm transition-colors ${
                        fieldErrors.fixedPrice
                          ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:bg-white ring-2 ring-rose-400/20'
                          : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0866ff]'
                      }`}
                      placeholder="VD: 500000"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                      ₫
                    </span>
                  </div>
                  {fieldErrors.fixedPrice && (
                    <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-0.5 animate-in fade-in duration-150">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      <span>{fieldErrors.fixedPrice}</span>
                    </p>
                  )}
                </label>
              )}

              {formData.pricingType === 'VEHICLE_SIZE' && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Giá theo cỡ xe (VNĐ) *</span>
                    <span className="text-[11px] text-slate-400">Tối thiểu 1 cỡ xe</span>
                  </div>
                  {fieldErrors.sizePrices && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium flex items-center gap-1.5 animate-in fade-in duration-150">
                      <span className="material-symbols-outlined text-[16px] text-rose-500 shrink-0">error</span>
                      <span>{fieldErrors.sizePrices}</span>
                    </div>
                  )}
                  <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {VEHICLE_SIZES.map((size) => {
                      const hasErr = Boolean(fieldErrors[`size_${size}`]);
                      return (
                        <label key={size} className="flex flex-col gap-1">
                          <span className="text-[11px] font-medium text-slate-600">
                            {SIZE_LABELS[size]}
                          </span>
                          <div className="relative">
                            <input
                              type="number"
                              step="1000"
                              min="1000"
                              value={formData.sizePrices[size] || ''}
                              onKeyDown={(e) => {
                                if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              onChange={(e) => {
                                setFormData((p) => ({
                                  ...p,
                                  sizePrices: { ...p.sizePrices, [size]: e.target.value },
                                }));
                                if (fieldErrors.sizePrices || fieldErrors[`size_${size}`]) {
                                  setFieldErrors((p) => {
                                    const n = { ...p };
                                    delete n.sizePrices;
                                    delete n[`size_${size}`];
                                    return n;
                                  });
                                }
                              }}
                              className={`w-full h-9 pl-3 pr-6 border rounded-xl text-xs transition-colors ${
                                hasErr
                                  ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:bg-white ring-2 ring-rose-400/20'
                                  : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0866ff]'
                              }`}
                              placeholder="0"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 pointer-events-none">
                              ₫
                            </span>
                          </div>
                          {hasErr && (
                            <p className="text-[10px] text-rose-500 font-medium leading-tight mt-0.5">
                              {fieldErrors[`size_${size}`]}
                            </p>
                          )}
                        </label>
                      );
                    })}
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
                  {submitting ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Lưu lại'}
                </button>
              </div>
            </form>
      </Modal>
      <ConfirmModal
        isOpen={!!confirmItem}
        title={confirmItem?.isActive ? 'Vô hiệu hóa dịch vụ' : 'Kích hoạt dịch vụ'}
        message={
          confirmItem
            ? `Bạn có chắc chắn muốn ${confirmItem.isActive ? 'ngừng cung cấp' : 'kích hoạt lại'} dịch vụ "${confirmItem.name}" không?`
            : ''
        }
        confirmText={confirmItem?.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
        isDestructive={confirmItem?.isActive}
        onConfirm={handleConfirmToggle}
        onCancel={() => setConfirmItem(null)}
      />
      <ConfirmModal
        isOpen={!!deleteItem}
        title="Xóa dịch vụ"
        message={
          deleteItem
            ? `Bạn có chắc chắn muốn xóa dịch vụ "${deleteItem.name}" không?`
            : ''
        }
        confirmText="Xác nhận xóa"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </div>
  );
}
