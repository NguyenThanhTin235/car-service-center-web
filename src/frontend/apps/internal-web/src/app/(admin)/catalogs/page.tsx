'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { catalogApi, CatalogData } from '@/lib/api/catalogs';

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
  const [error, setError] = useState('');

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
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        catalogType: formData.catalogType,
        name: formData.name,
        description: formData.description || undefined,
        sortOrder: parseInt(formData.sortOrder) || 0,
      };
      if (editing) {
        await catalogApi.update(editing.id, payload);
      } else {
        await catalogApi.create(payload);
      }
      setShowModal(false);
      load(pagination.currentPage);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (c: CatalogData) => {
    if (!confirm(`${c.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'} danh mục "${c.name}"?`)) return;
    try {
      await catalogApi.toggle(c.id);
      load(pagination.currentPage);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const activeCount = catalogs.filter((c) => c.isActive).length;

  return (
    <div className="space-y-6 font-[Be_Vietnam_Pro,sans-serif] text-slate-900">
      {/* 1. SaaS Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
          Danh mục chung
        </h1>
        <button
          onClick={openCreate}
          className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:brightness-110 text-white flex items-center gap-2 text-xs font-bold transition-all active:scale-[0.98] shadow-md shadow-[#0866ff]/20 self-start lg:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>+ Thêm danh mục</span>
        </button>
      </div>

      {/* 2. Asymmetrical 12-Col Bento Summary (4 + 8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Hero Card (4 cols) */}
        <div
          onClick={() => setFilterType('')}
          className="lg:col-span-4 cursor-pointer rounded-2xl saas-hero-gradient text-white p-5 relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute inset-0 saas-subtle-grid pointer-events-none" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-blue-100/90">Tổng tham số danh mục</span>
              <div className="text-3xl font-mono font-extrabold tabular-nums tracking-tight mt-1">
                {pagination.totalRecords}{' '}
                <span className="text-sm font-sans font-medium text-blue-100/80">bản ghi</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-xs">
              <span className="material-symbols-outlined text-[20px] text-white">list_alt</span>
            </div>
          </div>
          <div className="relative z-10 mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-blue-50">
            <span>Đang hoạt động</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/15 font-mono font-semibold">
              {activeCount} mục
            </span>
          </div>
        </div>

        {/* 4 Interactive Type Filter Tiles (8 cols) */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(CATALOG_TYPES).map(([type, label]) => {
            const isSelected = filterType === type;
            const count = typeCounts[type] ?? 0;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(isSelected ? '' : type)}
                className={`text-left p-4 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/90 border-[#0866ff] shadow-xs ring-1 ring-[#0866ff]/20'
                    : 'bg-white border-slate-200/80 hover:border-blue-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 leading-snug">{label}</span>
                  <span className="material-symbols-outlined text-[16px] text-slate-500">
                    {isSelected ? 'filter_alt_off' : 'arrow_forward'}
                  </span>
                </div>
                <div className="mt-2 text-2xl font-mono font-extrabold tabular-nums text-slate-900">
                  {count}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold ${TYPE_COLOR[type]}`}
                  >
                    {count} mục
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
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
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 text-xs uppercase tracking-wider font-bold border-b border-slate-200/80">
                <th className="py-3.5 px-5 font-mono">ID</th>
                <th className="py-3.5 px-5">Tên danh mục</th>
                <th className="py-3.5 px-5">Loại</th>
                <th className="py-3.5 px-5">Thứ tự</th>
                <th className="py-3.5 px-5 text-right pr-6">Trạng thái &amp; Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-600">
                    Đang tải danh mục tham số...
                  </td>
                </tr>
              ) : catalogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-600">
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
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {c.isActive ? 'toggle_off' : 'toggle_on'}
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

        <div className="px-5 py-3.5 flex items-center justify-between border-t border-slate-200/80 bg-slate-50/40">
          <span className="text-xs text-slate-500">
            Tổng <span className="font-mono font-bold text-slate-700">{pagination.totalRecords}</span>{' '}
            danh mục
          </span>
          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => load(p)}
                  className={`w-8 h-8 rounded-lg font-mono text-xs font-semibold cursor-pointer ${
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

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200/80">
              <h2 className="text-base font-bold text-slate-900">
                {editing ? 'Cập nhật danh mục' : 'Thêm danh mục chung'}
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
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">Loại danh mục *</span>
                  <select
                    required
                    value={formData.catalogType}
                    onChange={(e) => setFormData((p) => ({ ...p, catalogType: e.target.value }))}
                    disabled={!!editing}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0866ff] disabled:bg-slate-100 cursor-pointer"
                  >
                    {Object.entries(CATALOG_TYPES).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">Thứ tự hiển thị</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData((p) => ({ ...p, sortOrder: e.target.value }))}
                    className="h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0866ff]"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Tên danh mục *</span>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0866ff]"
                  placeholder="VD: Cái, Bộ, Mét, ..."
                />
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
                  {submitting ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
