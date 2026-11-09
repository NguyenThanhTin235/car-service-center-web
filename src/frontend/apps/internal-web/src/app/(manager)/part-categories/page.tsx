'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchPartCategories,
  fetchUoms,
  PartCategory,
} from '@/store/slices/inventorySlice';
import { PartCategoryModal } from './components/PartCategoryModal';
import Toast from '@/components/shared/Toast';

const ITEM_TYPE_LABELS: Record<string, string> = {
  PART: 'Phụ tùng',
  CONSUMABLE: 'Vật tư tiêu hao',
  CHEMICAL: 'Hóa chất',
  ACCESSORY: 'Phụ kiện',
};

export default function PartCategoriesPage() {
  const dispatch = useAppDispatch();
  const { categories, uoms, loading } = useAppSelector(state => state.inventory);

  const [search, setSearch] = useState('');
  const [itemType, setItemType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PartCategory | null>(null);
  
  const [toast, setToast] = useState<{show: boolean, type: 'success' | 'error', message: string}>({ show: false, type: 'success', message: '' });

  useEffect(() => {
    dispatch(fetchPartCategories());
    dispatch(fetchUoms());
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemType]);

  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
      if (itemType !== 'all' && c.itemType !== itemType) return false;
      if (search) {
        const query = search.toLowerCase();
        return (c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query));
      }
      return true;
    });
  }, [categories, search, itemType]);

  const totalPages = Math.ceil(filteredCategories.length / pageSize) || 1;
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, currentPage, pageSize]);

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category: PartCategory) => {
    setSelectedCategory(category);
    setIsCategoryModalOpen(true);
  };

  const partCount = categories.filter((c) => c.itemType === 'PART').length;
  const consumableCount = categories.filter((c) => c.itemType === 'CONSUMABLE').length;
  const chemAccCount = categories.filter(
    (c) => c.itemType === 'CHEMICAL' || c.itemType === 'ACCESSORY'
  ).length;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'PART':
        return 'bg-blue-50 text-[#0050cd] border-blue-200/80';
      case 'CONSUMABLE':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
      case 'CHEMICAL':
        return 'bg-amber-50 text-amber-800 border-amber-200/80';
      case 'ACCESSORY':
        return 'bg-purple-50 text-purple-800 border-purple-200/80';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200/80';
    }
  };

  return (
    <div className="flex flex-col min-w-0 space-y-6">
      {/* 1. SaaS Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
          Danh mục phụ tùng
        </h1>

        <button
          onClick={handleAddCategory}
          className="h-10 px-4 flex items-center gap-2 bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-md shadow-[#0866ff]/20 active:scale-[0.98] transition-all self-start sm:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
          <span>Thêm danh mục</span>
        </button>
      </div>

      {/* 2. Asymmetrical 12-Col Bento Summary (5 + 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Hero Card (5 cols) */}
        <div
          onClick={() => setItemType('all')}
          className="lg:col-span-5 cursor-pointer rounded-2xl saas-hero-gradient text-white p-5 relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute inset-0 saas-subtle-grid pointer-events-none" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-blue-100/90">
                Tổng danh mục gốc (Master)
              </span>
              <div className="text-3xl font-mono font-extrabold tabular-nums tracking-tight mt-1">
                {categories.length}{' '}
                <span className="text-sm font-sans font-medium text-blue-100/80">nhóm chuẩn</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-xs">
              <span className="material-symbols-outlined text-[22px] text-white">account_tree</span>
            </div>
          </div>
          <div className="relative z-10 mt-4 pt-3.5 border-t border-white/15 flex items-center justify-between text-xs text-blue-50">
            <span>Đơn vị tính đang áp dụng</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/15 font-mono font-semibold">
              {uoms.length} ĐVT
            </span>
          </div>
        </div>

        {/* 3 Type Breakdown Tiles (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setItemType(itemType === 'PART' ? 'all' : 'PART')}
            className={`text-left rounded-2xl p-4 border transition-all flex flex-col justify-between cursor-pointer ${
              itemType === 'PART'
                ? 'bg-blue-50/90 border-[#0866ff] shadow-sm'
                : 'bg-white border-slate-200/80 hover:border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Phụ tùng (PART)</span>
              <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-[#0866ff] flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">settings</span>
              </div>
            </div>
            <div className="text-2xl font-mono font-extrabold tabular-nums text-slate-900 mt-2">
              {partCount}
            </div>
            <span className="text-[11px] text-[#0866ff] font-medium mt-1">Linh kiện thay thế</span>
          </button>

          <button
            type="button"
            onClick={() => setItemType(itemType === 'CONSUMABLE' ? 'all' : 'CONSUMABLE')}
            className={`text-left rounded-2xl p-4 border transition-all flex flex-col justify-between cursor-pointer ${
              itemType === 'CONSUMABLE'
                ? 'bg-emerald-50/90 border-emerald-400 shadow-sm'
                : 'bg-white border-slate-200/80 hover:border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Vật tư tiêu hao</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">handyman</span>
              </div>
            </div>
            <div className="text-2xl font-mono font-extrabold tabular-nums text-slate-900 mt-2">
              {consumableCount}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium mt-1">Phục vụ bảo dưỡng</span>
          </button>

          <button
            type="button"
            onClick={() => setItemType(itemType === 'CHEMICAL' ? 'all' : 'CHEMICAL')}
            className={`text-left rounded-2xl p-4 border transition-all flex flex-col justify-between cursor-pointer ${
              itemType === 'CHEMICAL'
                ? 'bg-amber-50/90 border-amber-400 shadow-sm'
                : 'bg-white border-slate-200/80 hover:border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Hóa chất &amp; Phụ kiện</span>
              <div className="w-8 h-8 rounded-lg bg-amber-100/80 text-amber-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">science</span>
              </div>
            </div>
            <div className="text-2xl font-mono font-extrabold tabular-nums text-slate-900 mt-2">
              {chemAccCount}
            </div>
            <span className="text-[11px] text-amber-700 font-medium mt-1">Dầu nhớt &amp; Phụ gia</span>
          </button>
        </div>
      </div>

      {/* 3. Toolbar */}
      <div className="saas-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="flex items-center gap-2 min-w-[260px] flex-1 sm:max-w-sm h-9 px-3 rounded-xl bg-slate-50/80 border border-slate-200/80 focus-within:bg-white focus-within:border-[#0866ff] transition-all">
              <span className="material-symbols-outlined text-slate-500 text-[18px] shrink-0">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo mã code, tên danh mục..."
                className="flex-1 min-w-0 bg-transparent text-slate-900 placeholder:text-slate-500 text-xs focus:outline-none"
              />
            </div>

            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              className="h-9 px-3 text-xs font-semibold text-slate-700 bg-slate-50/80 border border-slate-200/80 rounded-xl focus:border-[#0866ff] outline-none cursor-pointer"
            >
              <option value="all">Loại: Tất cả</option>
              <option value="PART">Phụ tùng</option>
              <option value="CONSUMABLE">Vật tư tiêu hao</option>
              <option value="CHEMICAL">Hóa chất</option>
              <option value="ACCESSORY">Phụ kiện</option>
            </select>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Hiển thị <strong className="text-slate-700">{filteredCategories.length}</strong> danh mục
          </span>
        </div>
      </div>

      {/* 4. Table */}
      <div className="saas-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="h-11 bg-slate-50/90 border-b border-slate-200/80 text-xs text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-5 font-mono">Mã Code</th>
                <th className="py-3 px-5 min-w-[240px]">Tên danh mục</th>
                <th className="py-3 px-5">Phân loại</th>
                <th className="py-3 px-5">Đơn vị tính</th>
                <th className="py-3 px-5 text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500 text-xs">
                    Đang tải danh mục phụ tùng...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 text-xs">
                    Không có dữ liệu danh mục phù hợp
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-blue-50/25 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-xs font-bold text-[#0866ff]">
                      {cat.code}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900">{cat.name}</div>
                      {cat.description && (
                        <div className="text-xs text-slate-600 truncate max-w-sm mt-0.5">
                          {cat.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getTypeBadge(
                          cat.itemType
                        )}`}
                      >
                        {ITEM_TYPE_LABELS[cat.itemType] || cat.itemType}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-xs font-medium text-slate-700">
                      {cat.uom?.name || '—'}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <button
                        onClick={() => handleEditCategory(cat)}
                        className="w-8 h-8 mx-auto rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 text-[#0866ff] flex items-center justify-center transition-colors cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <span className="material-symbols-outlined text-[17px]">edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80 bg-slate-50/40">
          <span className="text-xs text-slate-700">
            Hiển thị <span className="font-mono font-bold text-slate-900">{paginatedCategories.length}</span>{' '}
            trong tổng số{' '}
            <span className="font-mono font-bold text-slate-900">{filteredCategories.length}</span>{' '}
            danh mục
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
                title="Trang trước"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg font-mono text-xs font-semibold transition-colors cursor-pointer ${
                    page === currentPage
                      ? 'bg-[#0866ff] text-white shadow-2xs'
                      : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
                title="Trang sau"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <PartCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        category={selectedCategory}
        onSuccess={() => {
          dispatch(fetchPartCategories());
          setToast({ show: true, type: 'success', message: selectedCategory ? 'Cập nhật danh mục thành công' : 'Thêm danh mục thành công' });
        }}
        uomOptions={uoms}
      />

      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({...toast, show: false})} />
      )}
    </div>
  );
}
