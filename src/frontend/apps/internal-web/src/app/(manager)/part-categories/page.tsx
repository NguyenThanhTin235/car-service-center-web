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

export default function PartCategoriesPage() {
  const dispatch = useAppDispatch();
  const { categories, uoms, loading } = useAppSelector(state => state.inventory);

  const [search, setSearch] = useState('');
  const [itemType, setItemType] = useState('all');
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PartCategory | null>(null);
  
  const [toast, setToast] = useState<{show: boolean, type: 'success' | 'error', message: string}>({ show: false, type: 'success', message: '' });

  useEffect(() => {
    dispatch(fetchPartCategories());
    dispatch(fetchUoms());
  }, []);

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

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category: PartCategory) => {
    setSelectedCategory(category);
    setIsCategoryModalOpen(true);
  };

  return (
    <div className="flex flex-col min-w-0 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-headline-lg font-headline-lg text-on-surface tracking-tight">Danh mục phụ tùng</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline mb-2">
              <span className="text-label-sm font-label-sm uppercase tracking-wider">Tổng danh mục (Master)</span>
              <div className="p-2 rounded-lg bg-surface-container-low text-primary">
                <span className="material-symbols-outlined text-[20px]">account_tree</span>
              </div>
            </div>
            <div>
              <div className="text-numeric-metric font-numeric-metric text-on-surface">{categories.length} <span className="text-label-md font-normal text-outline">nhóm</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/60 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative min-w-[280px] flex-1 sm:flex-initial">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-outline">
                <span className="material-symbols-outlined text-[18px]">search</span>
              </span>
              <input 
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm theo mã code, tên danh mục..."
                className="w-full h-9 pl-9 pr-3 text-body-sm bg-surface-container-lowest border border-[#D8DADF] rounded-md focus:border-primary-container focus:ring-1 outline-none"
              />
            </div>
            
            <select 
              value={itemType}
              onChange={e => setItemType(e.target.value)}
              className="h-9 px-3 text-label-sm bg-surface-container-lowest border border-[#D8DADF] rounded-md outline-none"
            >
              <option value="all">Loại: Tất cả</option>
              <option value="PART">Phụ tùng</option>
              <option value="CONSUMABLE">Vật tư tiêu hao</option>
              <option value="CHEMICAL">Hóa chất</option>
              <option value="ACCESSORY">Phụ kiện</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 self-end lg:self-center">
            <button onClick={handleAddCategory} className="h-9 px-3.5 flex items-center gap-2 bg-primary-container text-on-primary hover:bg-primary rounded-md text-label-md font-medium shadow-sm transition-colors">
              <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
              Thêm Danh mục
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-[#E4E6EB] text-label-sm text-outline h-10">
                <th className="py-2.5 px-4 font-semibold uppercase">Mã Code</th>
                <th className="py-2.5 px-4 font-semibold uppercase min-w-[240px]">Tên danh mục</th>
                <th className="py-2.5 px-4 font-semibold uppercase">Phân loại</th>
                <th className="py-2.5 px-4 font-semibold uppercase">Đơn vị tính</th>
                <th className="py-2.5 px-4 font-semibold uppercase text-center min-w-[120px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E6EB] text-body-md">
              {filteredCategories.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-outline">Không có dữ liệu</td></tr>
              ) : filteredCategories.map(cat => (
                <tr key={cat.id} className="hover:bg-[#F0F2F5] transition-colors">
                  <td className="py-3 px-4 font-medium text-on-surface">{cat.code}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-on-surface">{cat.name}</div>
                    {cat.description && <div className="text-body-sm text-outline truncate max-w-sm">{cat.description}</div>}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-label-sm font-medium bg-surface-container-high text-on-surface-variant">
                      {cat.itemType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-outline">{cat.uom?.name || '—'}</td>
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => handleEditCategory(cat)} className="p-1 text-primary hover:bg-surface-container-low rounded" title="Chỉnh sửa">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
