'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { catalogApi, CatalogData } from '@/lib/api/catalogs';
import ConfirmModal from '@/components/shared/ConfirmModal';
import Modal from '@/components/shared/Modal';
import TablePagination from '@/components/shared/TablePagination';
import toast from 'react-hot-toast';
import { validateName, validateRequired, validateInteger } from '@/lib/utils/validators';

const CATALOG_TYPES: Record<string, string> = {
  UOM: 'Đơn vị đo lường',
  CANCEL_REASON: 'Lý do hủy',
  ADJUST_REASON: 'Lý do điều chỉnh',
  TERMS: 'Điều khoản',
};

const TYPE_COLOR: Record<string, string> = {
  UOM: 'bg-blue-50 text-[#0050cd] border border-blue-200/80',
  CANCEL_REASON: 'bg-rose-50 text-rose-700 border border-rose-200/80',
  ADJUST_REASON: 'bg-amber-50 text-amber-800 border border-amber-200/80',
  TERMS: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
};

interface FormData {
  catalogType: string;
  name: string;
  description: string;
  sortOrder: string;
}

const defaultForm: FormData = {
  catalogType: 'UOM',
  name: '',
  description: '',
  sortOrder: '0',
};

export default function CatalogsPage() {
  const [catalogs, setCatalogs] = useState<CatalogData[]>([]);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({
    UOM: 0,
    CANCEL_REASON: 0,
    ADJUST_REASON: 0,
    TERMS: 0,
  });
  const [pagination, setPagination] = useState({
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
  });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CatalogData | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [confirmCat, setConfirmCat] = useState<CatalogData | null>(null);
  const [deleteCat, setDeleteCat] = useState<CatalogData | null>(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await catalogApi.getAll({
          search,
          catalogType: filterType || undefined,
          page,
          limit: 10,
        });
        setCatalogs(res.data.data);
        setPagination(res.data.pagination);
        if (res.data.typeCounts) {
          setTypeCounts(res.data.typeCounts);
        }
      } catch (e: any) {
        setError(e.response?.data?.message || 'Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    },
    [search, filterType]
  );

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setFormData(defaultForm);
    setError('');
    setFieldErrors({});
    setShowModal(true);
  };

  const openEdit = (c: CatalogData) => {
    setEditing(c);
    setFormData({
      catalogType: c.catalogType,
      name: c.name,
      description: c.description || '',
      sortOrder: String(c.sortOrder),
    });
    setError('');
    setFieldErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const nameErr = validateName(formData.name, 'Tên danh mục', 2, 100);
    if (nameErr) errors.name = nameErr;

    const typeErr = validateRequired(formData.catalogType, 'Loại danh mục');
    if (typeErr) errors.catalogType = typeErr;

    const sortErr = validateInteger(formData.sortOrder, 'Thứ tự hiển thị', 0);
    if (sortErr) errors.sortOrder = sortErr;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setError('');
    setFieldErrors({});
    try {
      const payload = {
        catalogType: formData.catalogType,
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        sortOrder: parseInt(formData.sortOrder) || 0,
      };
      if (editing) {
        await catalogApi.update(editing.id, payload);
        toast.success(`Cập nhật danh mục "${payload.name}" thành công`);
      } else {
        await catalogApi.create(payload);
        toast.success(`Thêm danh mục "${payload.name}" thành công`);
      }
      setShowModal(false);
      load(pagination.currentPage);
    } catch (e: any) {
      const errMsg = e.response?.data?.message || 'Có lỗi xảy ra';
      setError(errMsg);
      if (errMsg.includes('Tên danh mục đã tồn tại trong nhóm này')) {
        setFieldErrors({ name: errMsg });
      }
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = (c: CatalogData) => {
    setConfirmCat(c);
  };

  const handleConfirmToggle = async () => {
    if (!confirmCat) return;
    try {
      await catalogApi.toggle(confirmCat.id);
      toast.success(confirmCat.isActive ? `Đã vô hiệu hóa danh mục "${confirmCat.name}"` : `Đã kích hoạt danh mục "${confirmCat.name}"`);
      load(pagination.currentPage);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setConfirmCat(null);
    }
  };

  const handleDelete = (c: CatalogData) => {
    setDeleteCat(c);
  };

  const handleConfirmDelete = async () => {
    if (!deleteCat) return;
    try {
      await catalogApi.delete(deleteCat.id);
      toast.success(`Đã xóa danh mục "${deleteCat.name}" thành công`);
      load(pagination.currentPage);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Không thể xóa danh mục này');
    } finally {
      setDeleteCat(null);
    }
  };

  const activeCount = catalogs.filter((c) => c.isActive).length;

  return (
    <div className="space-y-6 text-slate-900">
      {/* 1. Asymmetrical 12-Col Bento Summary (4 + 8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Navy (#0c2340) - Tổng tham số danh mục (4 cols) */}
        <div
          onClick={() => setFilterType('')}
          className="lg:col-span-4 cursor-pointer rounded-[24px] bg-[#0c2340] text-white p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between min-h-[170px] shadow-md hover:shadow-lg transition-all group"
        >
          <div className="absolute inset-0 saas-subtle-grid pointer-events-none opacity-40" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-300 tracking-wide">Tổng tham số danh mục</span>
              <div className="text-3xl sm:text-4xl font-mono font-extrabold tabular-nums tracking-tight text-white mt-1.5">
                {pagination.totalRecords}{' '}
                <span className="text-sm font-sans font-medium text-zinc-300">bản ghi</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-xs text-zinc-300 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px]">list_alt</span>
            </div>
          </div>
          <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-300">
            <span>Đang hoạt động</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 font-mono font-bold text-white">
              {activeCount} mục
            </span>
          </div>
        </div>

        {/* 4 Interactive Type Filter Tiles (8 cols) mapped to Dashboard palette */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(CATALOG_TYPES).map(([type, label], idx) => {
            const isSelected = filterType === type;
            const count = typeCounts[type] ?? 0;
            
            // 4 Tone màu Dashboard: 
            // 0: Royal Blue (#0050cd)
            // 1: Soft Cool Slate (#e4e7ec)
            // 2: Midnight Indigo (#111827)
            // 3: Dark Navy (#0c2340)
            const tilePalette = [
              // 0: Royal Blue
              {
                container: 'bg-[#0050cd] text-white shadow-md shadow-[#0050cd]/20',
                label: 'text-blue-100',
                icon: 'text-blue-200',
                badge: 'bg-white/20 text-white',
                actionText: 'text-blue-200',
              },
              // 1: Soft Cool Slate
              {
                container: 'bg-[#e4e7ec] text-zinc-900 shadow-xs border border-slate-300/80',
                label: 'text-slate-700',
                icon: 'text-slate-500',
                badge: 'bg-white text-zinc-900 border border-slate-300',
                actionText: 'text-slate-600',
              },
              // 2: Midnight Indigo
              {
                container: 'bg-[#111827] text-white shadow-md',
                label: 'text-slate-300',
                icon: 'text-cyan-400',
                badge: 'bg-white/10 text-cyan-400 border border-white/10',
                actionText: 'text-slate-400',
              },
              // 3: Dark Navy
              {
                container: 'bg-[#0c2340] text-white shadow-md',
                label: 'text-zinc-300',
                icon: 'text-zinc-400',
                badge: 'bg-white/10 text-zinc-200 border border-white/10',
                actionText: 'text-zinc-400',
              },
            ];

            const theme = tilePalette[idx % tilePalette.length];

            return (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(isSelected ? '' : type)}
                className={`text-left p-4 rounded-[24px] flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden group ${
                  theme.container
                } ${
                  isSelected ? 'ring-3 ring-amber-400 scale-[1.02]' : 'hover:scale-[1.01]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold leading-snug tracking-wide ${theme.label}`}>
                    {label}
                  </span>
                  <span className={`material-symbols-outlined text-[17px] group-hover:translate-x-0.5 transition-transform ${theme.icon}`}>
                    {isSelected ? 'filter_alt_off' : 'arrow_forward'}
                  </span>
                </div>
                <div className="mt-2 text-2xl font-mono font-extrabold tabular-nums">
                  {count}
                </div>
                <div className="mt-2 flex items-center justify-between pt-2 border-t border-black/10 dark:border-white/10">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold ${theme.badge}`}
                  >
                    {count} mục
                  </span>
                  <span className={`text-[11px] font-medium ${theme.actionText}`}>
                    {isSelected ? 'Đang lọc' : 'Lọc'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Table */}
      <div className="w-full saas-card overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200/80">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
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
            <div className="w-full sm:w-52">
              <select
                className="w-full h-9 px-3 rounded-xl bg-slate-50/80 border border-slate-200/80 text-slate-700 font-semibold text-xs focus:outline-none focus:border-[#0866ff] cursor-pointer"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">Tất cả loại</option>
                {Object.entries(CATALOG_TYPES).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(1)}
              className="h-9 px-3.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0866ff] transition-colors cursor-pointer"
            >
              <span
                className={`material-symbols-outlined text-[18px] ${
                  loading ? 'animate-spin text-[#0866ff]' : ''
                }`}
              >
                sync
              </span>
              <span>Làm mới</span>
            </button>

            <button
              onClick={openCreate}
              className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:brightness-110 text-white flex items-center gap-1.5 text-xs font-bold transition-all active:scale-[0.98] shadow-sm shadow-[#0866ff]/20 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[17px]">add</span>
              <span>Thêm danh mục mới</span>
            </button>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 text-xs uppercase tracking-wider font-bold border-b border-slate-200/80">
                <th className="py-3.5 px-5 font-mono">ID</th>
                <th className="py-3.5 px-5">Tên danh mục</th>
                <th className="py-3.5 px-5">Loại</th>
                <th className="py-3.5 px-5">Thứ tự</th>
                <th className="py-3.5 px-5 text-center">Trạng thái</th>
                <th className="py-3.5 px-5 text-right pr-6">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-600">
                    Đang tải danh mục tham số...
                  </td>
                </tr>
              ) : catalogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-600">
                    Không tìm thấy danh mục phù hợp
                  </td>
                </tr>
              ) : (
                catalogs.map((c) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-blue-50/25 transition-colors ${
                      !c.isActive ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="py-3.5 px-5 font-mono text-xs font-bold text-[#0050cd]">
                      CAT-{String(c.id).padStart(4, '0')}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="text-sm font-bold text-slate-900">{c.name}</div>
                      {c.description && (
                        <div className="text-xs text-slate-600 truncate max-w-[260px] mt-0.5">
                          {c.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                          TYPE_COLOR[c.catalogType] || ''
                        }`}
                      >
                        {CATALOG_TYPES[c.catalogType] || c.catalogType}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-mono tabular-nums text-xs font-semibold text-slate-600">
                      {c.sortOrder}
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
                          onClick={() => openEdit(c)}
                          className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 text-[#0866ff] flex items-center justify-center transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <span className="material-symbols-outlined text-[17px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleToggle(c)}
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                            c.isActive
                              ? 'bg-rose-50 hover:bg-rose-500 hover:text-white border-rose-200/80 text-rose-600'
                              : 'bg-emerald-50 hover:bg-emerald-500 hover:text-white border-emerald-200/80 text-emerald-600'
                          }`}
                          title={c.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {c.isActive ? 'toggle_off' : 'toggle_on'}
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-rose-500 hover:text-white border border-slate-200/80 hover:border-rose-500 text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                          title="Xóa danh mục"
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
          recordLabel="danh mục"
        />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
        size="md"
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs border border-rose-200">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Loại danh mục *</span>
              <select
                required
                value={formData.catalogType}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, catalogType: e.target.value }));
                  if (fieldErrors.catalogType) setFieldErrors((p) => ({ ...p, catalogType: '' }));
                }}
                disabled={!!editing}
                className={`w-full h-10 px-3 border rounded-xl text-sm disabled:bg-slate-100 cursor-pointer transition-colors ${
                  fieldErrors.catalogType
                    ? 'bg-white border-rose-400 focus:border-rose-500 ring-2 ring-rose-400/20'
                    : 'bg-slate-50/50 focus:bg-white border-slate-200 focus:border-[#0866ff]'
                }`}
              >
                {Object.entries(CATALOG_TYPES).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
              {fieldErrors.catalogType && (
                <p className="text-[11px] text-rose-500 font-medium">{fieldErrors.catalogType}</p>
              )}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Thứ tự hiển thị</span>
              <input
                type="number"
                min="0"
                value={formData.sortOrder}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, sortOrder: e.target.value }));
                  if (fieldErrors.sortOrder) setFieldErrors((p) => ({ ...p, sortOrder: '' }));
                }}
                className={`h-10 px-3 border rounded-xl text-sm transition-colors ${
                  fieldErrors.sortOrder
                    ? 'bg-white border-rose-400 focus:border-rose-500 ring-2 ring-rose-400/20'
                    : 'bg-slate-50/50 focus:bg-white border-slate-200 focus:border-[#0866ff]'
                }`}
              />
              {fieldErrors.sortOrder && (
                <p className="text-[11px] text-rose-500 font-medium">{fieldErrors.sortOrder}</p>
              )}
            </label>
          </div>
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
              placeholder="VD: Cái, Bộ, Mét, ..."
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
              rows={2}
              placeholder="Mô tả (tùy chọn)"
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
        isOpen={!!confirmCat}
        title={confirmCat?.isActive ? 'Vô hiệu hóa danh mục' : 'Kích hoạt danh mục'}
        message={confirmCat ? `Bạn có chắc chắn muốn ${confirmCat.isActive ? 'vô hiệu hóa' : 'kích hoạt'} danh mục "${confirmCat.name}" không?` : ''}
        confirmText={confirmCat?.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
        isDestructive={confirmCat?.isActive}
        onConfirm={handleConfirmToggle}
        onCancel={() => setConfirmCat(null)}
      />
      <ConfirmModal
        isOpen={!!deleteCat}
        title="Xóa danh mục chung"
        message={
          deleteCat
            ? `Bạn có chắc chắn muốn xóa danh mục "${deleteCat.name}"? Hành động này không thể hoàn tác và chỉ thực hiện được khi danh mục chưa phát sinh liên kết trong hệ thống.`
            : ''
        }
        confirmText="Xóa vĩnh viễn"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteCat(null)}
      />
    </div>
  );
}
