'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { serviceCategoryApi, ServiceCategoryData } from '@/lib/api/serviceCategories';
import ConfirmModal from '@/components/shared/ConfirmModal';
import toast from 'react-hot-toast';
import { validateName } from '@/lib/utils/validators';

interface FormData {
  name: string;
  description: string;
  isActive: boolean;
}

const defaultForm: FormData = { name: '', description: '', isActive: true };

export default function ServiceCategoriesPage() {
  const [categories, setCategories] = useState<ServiceCategoryData[]>([]);
  const [pagination, setPagination] = useState({ totalRecords: 0, totalPages: 1, currentPage: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ServiceCategoryData | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ServiceCategoryData | null>(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await serviceCategoryApi.getAll({ search, page, limit: 10 });
      setCategories(res.data.data); 
      setPagination(res.data.pagination);
    } catch (e: any) { 
      setError(e.response?.data?.message || 'Lỗi tải dữ liệu'); 
    } finally { 
      setLoading(false); 
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setFormData(defaultForm); setError(''); setFieldErrors({}); setShowModal(true); };
  const openEdit = (c: ServiceCategoryData) => {
    setEditing(c);
    setFormData({ name: c.name, description: c.description || '', isActive: c.isActive });
    setError(''); setFieldErrors({}); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const nameErr = validateName(formData.name, 'Tên danh mục', 2, 100);
    if (nameErr) errors.name = nameErr;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setError('');
    setFieldErrors({});
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        isActive: formData.isActive,
      };
      editing ? await serviceCategoryApi.update(editing.id, payload) : await serviceCategoryApi.create(payload);
      setShowModal(false);
      load(pagination.currentPage);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (c: ServiceCategoryData) => {
    setItemToDelete(c);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await serviceCategoryApi.delete(itemToDelete.id);
      toast.success(`Đã xử lý xóa/vô hiệu hóa nhóm "${itemToDelete.name}" thành công`);
      load(pagination.currentPage);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setItemToDelete(null);
    }
  };

  const activeCount = categories.filter(c => c.isActive).length;
  const totalServicesLinked = categories.reduce((acc, c) => acc + (c.templatesCount || 0), 0);

  return (
    <div className="space-y-6 text-slate-900">
      {/* 1. SaaS Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
          Danh mục Dịch vụ
        </h1>
        <button
          onClick={openCreate}
          className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:brightness-110 text-white flex items-center gap-2 text-xs font-bold transition-all active:scale-[0.98] shadow-md shadow-[#0866ff]/20 self-start lg:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Thêm danh mục</span>
        </button>
      </div>

      {/* 2. Asymmetrical 12-Col Bento Summary (5 + 4 + 3) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Hero Card (5 cols) */}
        <div className="md:col-span-5 rounded-2xl saas-hero-gradient text-white p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 saas-subtle-grid pointer-events-none" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-blue-100/90">Tổng số nhóm danh mục</span>
              <div className="text-3xl font-mono font-extrabold tabular-nums tracking-tight mt-1">
                {pagination.totalRecords}{' '}
                <span className="text-sm font-sans font-medium text-blue-100/80">danh mục</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-xs">
              <span className="material-symbols-outlined text-[22px] text-white">category</span>
            </div>
          </div>
          <div className="relative z-10 mt-4 pt-3.5 border-t border-white/15 flex items-center justify-between text-xs text-blue-50">
            <span>Dịch vụ trực thuộc trang này</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/15 font-mono font-semibold">
              {totalServicesLinked} gói dịch vụ
            </span>
          </div>
        </div>

        {/* Tile 2: Đang hoạt động (4 cols) */}
        <div className="md:col-span-4 saas-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Đang hoạt động</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold tabular-nums text-slate-900 mt-2">
            {activeCount}
          </div>
          <span className="text-xs text-emerald-700 font-semibold mt-1">Hiển thị trên bảng giá</span>
        </div>

        {/* Tile 3: Vô hiệu hóa (3 cols) */}
        <div className="md:col-span-3 saas-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Vô hiệu hóa</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200/60 text-rose-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">cancel</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold tabular-nums text-slate-900 mt-2">
            {Math.max(0, pagination.totalRecords - activeCount)}
          </div>
          <span className="text-xs text-slate-600 font-medium mt-1">Đã ẩn khỏi lựa chọn</span>
        </div>
      </div>

      {/* 3. Table */}
      <div className="w-full saas-card overflow-hidden">
        <div className="p-4 flex items-center justify-between gap-3 border-b border-slate-200/80">
          <div className="flex items-center gap-2 flex-1 max-w-md h-9 px-3 rounded-xl bg-slate-50/80 border border-slate-200/80 focus-within:bg-white focus-within:border-[#0866ff] transition-all">
            <span className="material-symbols-outlined text-slate-500 text-[18px] shrink-0">
              search
            </span>
            <input
              className="flex-1 min-w-0 bg-transparent text-slate-900 placeholder:text-slate-500 text-xs focus:outline-none"
              placeholder="Tìm theo tên danh mục..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load(1)}
            />
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
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 text-xs uppercase tracking-wider font-bold border-b border-slate-200/80">
                <th className="py-3.5 px-5 font-mono">ID</th>
                <th className="py-3.5 px-5">Tên danh mục</th>
                <th className="py-3.5 px-5 text-center">Số lượng dịch vụ</th>
                <th className="py-3.5 px-5 text-right pr-6">Trạng thái &amp; Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-xs text-slate-600">
                    Đang tải danh mục dịch vụ...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-xs text-slate-600">
                    Không tìm thấy danh mục phù hợp
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-blue-50/25 transition-colors ${
                      !c.isActive ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="py-3.5 px-5 font-mono text-xs font-bold text-[#0050cd]">
                      CAT-{String(c.id).padStart(3, '0')}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="text-sm font-bold text-slate-900">{c.name}</div>
                      {c.description && (
                        <div className="text-xs text-slate-600 truncate max-w-[420px] mt-0.5">
                          {c.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-blue-50 text-[#0050cd] border border-blue-300 font-mono text-xs font-bold">
                        {c.templatesCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            c.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                              : 'bg-rose-50 text-rose-700 border-rose-200/80'
                          }`}
                        >
                          {c.isActive ? 'Hoạt động' : 'Vô hiệu'}
                        </span>
                        <button
                          onClick={() => openEdit(c)}
                          className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 text-[#0050cd] flex items-center justify-center transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <span className="material-symbols-outlined text-[17px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-500 hover:text-white border border-rose-200/80 text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                          title="Xóa / Vô hiệu hóa"
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

        <div className="px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80 bg-slate-50/40">
          <span className="text-xs text-slate-700">
            Hiển thị <span className="font-mono font-bold text-slate-900">{categories.length}</span>{' '}
            trong <span className="font-mono font-bold text-slate-900">{pagination.totalRecords}</span>{' '}
            danh mục
          </span>
          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => load(p)}
                  className={`w-8 h-8 rounded-lg font-mono text-xs font-semibold transition-colors cursor-pointer ${
                    p === pagination.currentPage
                      ? 'bg-[#0866ff] text-white shadow-2xs'
                      : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-800'
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
          <div className="bg-white rounded-2xl border border-slate-200/80 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200/80">
              <h2 className="text-base font-bold text-slate-900">
                {editing ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
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
                <span className="text-xs font-semibold text-slate-600">Tên danh mục *</span>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, name: e.target.value }));
                    if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: '' }));
                  }}
                  className={`h-10 px-3 border rounded-xl text-sm transition-colors ${
                    fieldErrors.name
                      ? 'bg-white border-rose-400 focus:border-rose-500 ring-2 ring-rose-400/20'
                      : 'bg-slate-50/50 focus:bg-white border-slate-200 focus:border-[#0866ff]'
                  }`}
                  placeholder="Ví dụ: Vệ sinh xe, Bảo dưỡng..."
                />
                {fieldErrors.name && (
                  <p className="text-[11px] text-rose-500 font-medium">{fieldErrors.name}</p>
                )}
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Mô tả</span>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0866ff] resize-none"
                  rows={3}
                  placeholder="Mô tả nhóm dịch vụ"
                />
              </label>

              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                  className="w-4 h-4 text-[#0866ff] border-slate-300 rounded"
                />
                <span className="text-xs text-slate-800 font-semibold">Hoạt động</span>
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
                  {submitting ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
          <ConfirmModal
        isOpen={!!itemToDelete}
        title="Xác nhận xóa danh mục dịch vụ"
        message={itemToDelete ? (itemToDelete.templatesCount > 0 ? `Nhóm "${itemToDelete.name}" đang có ${itemToDelete.templatesCount} dịch vụ. Nếu xóa, nhóm này sẽ được chuyển sang vô hiệu hóa để bảo vệ tính toàn vẹn dữ liệu.` : `Bạn có chắc chắn muốn xóa nhóm dịch vụ "${itemToDelete.name}" không?`) : ''}
        confirmText="Xác nhận xóa"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
