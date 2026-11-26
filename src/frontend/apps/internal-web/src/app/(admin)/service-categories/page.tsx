'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { serviceCategoryApi, ServiceCategoryData } from '@/lib/api/serviceCategories';
import ConfirmModal from '@/components/shared/ConfirmModal';
import Modal from '@/components/shared/Modal';
import TablePagination from '@/components/shared/TablePagination';
import toast from 'react-hot-toast';
import { validateName } from '@/lib/utils/validators';
import { useDebounce } from '@/hooks/useDebounce';

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
  const debouncedSearch = useDebounce(search, 300);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ServiceCategoryData | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ServiceCategoryData | null>(null);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = useCallback(async (page = 1, signal?: AbortSignal) => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await serviceCategoryApi.getAll({ search: debouncedSearch, page, limit: 10 }, signal);
      if (!signal?.aborted) {
        setCategories(res.data.data); 
        setPagination(res.data.pagination);
      }
    } catch (e: any) { 
      if (e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED' || signal?.aborted) return;
      setLoadError(e.response?.data?.message || 'Không thể tải nhóm dịch vụ. Vui lòng thử lại.'); 
    } finally { 
      if (!signal?.aborted) {
        setLoading(false); 
      }
    }
  }, [debouncedSearch]);

  useEffect(() => {
    const controller = new AbortController();
    load(1, controller.signal);
    return () => controller.abort();
  }, [load]);

  const openCreate = () => { setEditing(null); setFormData(defaultForm); setError(''); setFieldErrors({}); setShowModal(true); };
  const openEdit = (c: ServiceCategoryData) => {
    setEditing(c);
    setFormData({ name: c.name, description: c.description || '', isActive: c.isActive });
    setError(''); setFieldErrors({}); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const nameVal = formData.name ? formData.name.trim() : '';
    if (!nameVal) {
      errors.name = 'Tên nhóm dịch vụ là bắt buộc.';
    } else {
      const nameErr = validateName(nameVal, 'Tên nhóm dịch vụ', 2, 100);
      if (nameErr) errors.name = nameErr;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setError('');
    setFieldErrors({});
    try {
      const payload = {
        name: nameVal,
        description: formData.description?.trim() || undefined,
        isActive: formData.isActive,
      };
      if (editing) {
        await serviceCategoryApi.update(editing.id, payload);
        toast.success('Cập nhật nhóm dịch vụ thành công.');
      } else {
        await serviceCategoryApi.create(payload);
        toast.success('Thêm nhóm dịch vụ thành công.');
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

  const handleDelete = (c: ServiceCategoryData) => {
    setItemToDelete(c);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await serviceCategoryApi.delete(itemToDelete.id);
      const isDeactivated = Boolean(
        res?.data?.data?.isDeactivated ||
        res?.data?.isDeactivated ||
        res?.data?.deleted === false ||
        (itemToDelete.templatesCount && itemToDelete.templatesCount > 0)
      );

      if (isDeactivated) {
        toast.success('Nhóm dịch vụ đã có dịch vụ phụ thuộc, đã được vô hiệu hóa thành công.');
      } else {
        toast.success('Xóa nhóm dịch vụ thành công.');
      }
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
      {/* 1. Asymmetrical 12-Col Bento Summary (5 + 4 + 3) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Card 1: Navy (#0c2340) - Tổng số nhóm danh mục (5 cols) */}
        <div className="md:col-span-5 rounded-[24px] bg-[#0c2340] text-white p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between min-h-[170px] shadow-md hover:shadow-lg transition-all group">
          <div className="absolute inset-0 saas-subtle-grid pointer-events-none opacity-40" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-300 tracking-wide">Tổng số nhóm danh mục</span>
              <div className="text-3xl sm:text-4xl font-mono font-extrabold tabular-nums tracking-tight text-white mt-1.5">
                {pagination.totalRecords}{' '}
                <span className="text-sm font-sans font-medium text-zinc-300">danh mục</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-xs text-zinc-300 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[22px]">category</span>
            </div>
          </div>
          <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-300">
            <span>Dịch vụ trực thuộc trang này</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 font-mono font-bold text-white">
              {totalServicesLinked} gói dịch vụ
            </span>
          </div>
        </div>

        {/* Card 2: Royal Blue (#0050cd) - Đang hoạt động (4 cols) */}
        <div className="md:col-span-4 rounded-[24px] bg-[#0050cd] text-white p-5 sm:p-6 flex flex-col justify-between shadow-md shadow-[#0050cd]/20 hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-100 tracking-wide">Đang hoạt động</span>
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold tabular-nums text-white mt-2">
            {activeCount}
          </div>
          <div className="flex items-center justify-between text-xs text-blue-100 mt-2 pt-2 border-t border-white/15">
            <span>Hiển thị trên bảng giá</span>
            <span className="font-mono font-bold">Hoạt động</span>
          </div>
        </div>

        {/* Card 3: Soft Cool Slate (#e4e7ec) - Vô hiệu hóa (3 cols) */}
        <div className="md:col-span-3 rounded-[24px] bg-[#e4e7ec] text-zinc-900 p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 tracking-wide">Vô hiệu hóa</span>
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-300 text-rose-600 flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">cancel</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold tabular-nums text-zinc-900 mt-2">
            {Math.max(0, categories.length - activeCount)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600 mt-2 pt-2 border-t border-slate-300/80">
            <span>Đã ẩn (Trang này)</span>
            <span className="font-mono font-semibold text-rose-700">Tạm dừng</span>
          </div>
        </div>
      </div>

      {/* 3. Table */}
      <div className="w-full saas-card overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200/80">
          <div className="flex items-center gap-2 flex-1 max-w-md h-9 px-3 rounded-xl bg-slate-50/80 border border-slate-200/80 focus-within:bg-white focus-within:border-[#0866ff] transition-all">
            <span className="material-symbols-outlined text-slate-500 text-[18px] shrink-0">
              search
            </span>
            <input
              className="flex-1 min-w-0 bg-transparent text-slate-900 placeholder:text-slate-500 text-xs focus:outline-none"
              placeholder="Tìm theo tên nhóm dịch vụ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load(1)}
            />
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
              <span>Thêm nhóm dịch vụ</span>
            </button>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 text-xs uppercase tracking-wider font-bold border-b border-slate-200/80">
                <th className="py-3.5 px-5 font-mono">ID</th>
                <th className="py-3.5 px-5">Tên nhóm dịch vụ</th>
                <th className="py-3.5 px-5 text-center">Số lượng dịch vụ</th>
                <th className="py-3.5 px-5 text-center">Trạng thái</th>
                <th className="py-3.5 px-5 text-right pr-6">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-5"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-5"><div className="h-4 w-48 bg-slate-200 rounded mb-1.5" /><div className="h-3 w-32 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-5"><div className="h-4 w-10 bg-slate-200 rounded mx-auto" /></td>
                    <td className="py-3.5 px-5"><div className="h-5 w-20 bg-slate-200 rounded-full mx-auto" /></td>
                    <td className="py-3.5 px-5 pr-6"><div className="h-7 w-20 bg-slate-200 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : loadError ? (
                <tr>
                  <td colSpan={5} className="py-12 px-4 text-center">
                    <div className="inline-flex flex-col items-center gap-2.5 max-w-md">
                      <span className="material-symbols-outlined text-3xl text-rose-500" aria-hidden="true">error</span>
                      <p className="text-sm font-semibold text-slate-800">{loadError}</p>
                      <button
                        type="button"
                        onClick={() => load(1)}
                        className="mt-1 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                      >
                        Thử lại
                      </button>
                    </div>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 px-4 text-center">
                    <div className="inline-flex flex-col items-center gap-2.5">
                      <span className="material-symbols-outlined text-3xl text-slate-400" aria-hidden="true">folder_off</span>
                      <p className="text-sm font-medium text-slate-600">Không tìm thấy nhóm dịch vụ phù hợp</p>
                      <div className="flex items-center gap-2 mt-1">
                        {search && (
                          <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                          >
                            Xóa bộ lọc
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={openCreate}
                          className="px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 cursor-pointer"
                        >
                          Thêm nhóm dịch vụ
                        </button>
                      </div>
                    </div>
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
                    <td className="py-3.5 px-5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          c.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                            : 'bg-rose-50 text-rose-700 border-rose-200/80'
                        }`}
                      >
                        {c.isActive ? 'Hoạt động' : 'Vô hiệu'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          aria-label={`Chỉnh sửa ${c.name}`}
                          className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 text-[#0050cd] flex items-center justify-center transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <span className="material-symbols-outlined text-[17px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          aria-label={`Xóa hoặc vô hiệu hóa ${c.name}`}
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

        <TablePagination
          totalRecords={pagination.totalRecords}
          totalPages={pagination.totalPages}
          currentPage={pagination.currentPage}
          onPageChange={load}
          currentCount={categories.length}
          recordLabel="danh mục"
        />
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Cập nhật nhóm dịch vụ' : 'Thêm nhóm dịch vụ'}
        size="sm"
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs border border-rose-200">
                  {error}
                </div>
              )}

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Tên nhóm dịch vụ *</span>
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
                  {submitting ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Lưu lại'}
                </button>
              </div>
            </form>
      </Modal>
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Xóa nhóm dịch vụ"
        message={
          itemToDelete
            ? itemToDelete.templatesCount > 0
              ? `Nhóm "${itemToDelete.name}" đang có ${itemToDelete.templatesCount} dịch vụ con phụ thuộc. Nếu xóa, nhóm này sẽ được chuyển sang vô hiệu hóa để bảo vệ tính toàn vẹn dữ liệu.`
              : `Bạn có chắc chắn muốn xóa nhóm dịch vụ "${itemToDelete.name}" không?`
            : ''
        }
        confirmText="Xác nhận xóa"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
