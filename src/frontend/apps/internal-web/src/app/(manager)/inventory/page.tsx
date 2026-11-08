'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchInventoryItems,
  toggleInventoryItem,
  fetchPartCategories,
  fetchBrands,
  fetchUoms,
  InventoryItem,
} from '@/store/slices/inventorySlice';
import { PartItemModal } from './components/PartItemModal';

import { GoodsReceiptModal } from './components/GoodsReceiptModal';
import ConfirmModal from '@/components/shared/ConfirmModal';
import Toast from '@/components/shared/Toast';

const ITEM_TYPE_LABELS: Record<string, string> = {
  PART: 'Phụ tùng',
  CONSUMABLE: 'Vật tư tiêu hao',
  CHEMICAL: 'Hóa chất',
  ACCESSORY: 'Phụ kiện',
};

const ITEM_TYPE_BADGE: Record<string, string> = {
  PART: 'bg-blue-50 text-[#0050cd] border-blue-200/80',
  CONSUMABLE: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
  CHEMICAL: 'bg-amber-50 text-amber-800 border-amber-200/80',
  ACCESSORY: 'bg-purple-50 text-purple-800 border-purple-200/80',
};

export default function InventoryPage() {
  const dispatch = useAppDispatch();
  const { items, pagination, loading, categories, brands, uoms } = useAppSelector(state => state.inventory);

  const [search, setSearch] = useState('');
  const [itemType, setItemType] = useState('all');
  const [categoryId, setCategoryId] = useState('all');
  const [stockStatus, setStockStatus] = useState('all');
  
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<InventoryItem | null>(null);


  
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToToggle, setItemToToggle] = useState<InventoryItem | null>(null);
  
  const [toast, setToast] = useState<{show: boolean, type: 'success' | 'error', message: string}>({ show: false, type: 'success', message: '' });

  useEffect(() => {
    loadData(1);
    dispatch(fetchPartCategories());
    dispatch(fetchBrands());
    dispatch(fetchUoms());
  }, []);

  const loadData = (page = currentPage) => {
    setCurrentPage(page);
    dispatch(fetchInventoryItems({
      search: search || undefined,
      itemType: itemType !== 'all' ? itemType : undefined,
      partCategoryId: categoryId !== 'all' ? parseInt(categoryId) : undefined,
      page,
      limit,
    }));
  };

  const handleFilterReset = () => {
    setSearch('');
    setItemType('all');
    setCategoryId('all');
    setStockStatus('all');
    setCurrentPage(1);
    setTimeout(() => {
      dispatch(fetchInventoryItems({ page: 1, limit }));
    }, 0);
  };

  const filteredItems = items.filter(item => {
    if (stockStatus === 'low') return item.onHand < item.reorderLevel;
    if (stockStatus === 'sufficient') return item.onHand >= item.reorderLevel;
    return true;
  });

  const lowStockCount = items.filter(i => i.onHand < i.reorderLevel).length;
  const totalValue = items.reduce((sum, item) => sum + (item.onHand * item.averageCost), 0);

  const handleAddPart = () => {
    setSelectedPart(null);
    setIsPartModalOpen(true);
  };

  const handleEditPart = (item: InventoryItem) => {
    setSelectedPart(item);
    setIsPartModalOpen(true);
  };

  const handleToggleClick = (item: InventoryItem) => {
    setItemToToggle(item);
    setIsConfirmOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!itemToToggle) return;
    const res = await dispatch(toggleInventoryItem(itemToToggle.id));
    if (res.meta.requestStatus === 'fulfilled') {
      setToast({ show: true, type: 'success', message: 'Cập nhật trạng thái thành công' });
      loadData();
    } else {
      setToast({ show: true, type: 'error', message: 'Lỗi khi cập nhật trạng thái' });
    }
    setIsConfirmOpen(false);
  };

  return (
    <div className="flex flex-col min-w-0 space-y-6">
      {/* 1. SaaS Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
          Quản lý kho phụ tùng
        </h1>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            id="btn-add-part"
            onClick={handleAddPart}
            className="h-10 px-4 flex items-center gap-2 bg-white text-slate-700 hover:text-[#0866ff] border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/40 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-[#0866ff]">add</span>
            <span>Thêm Phụ tùng</span>
          </button>
          <button
            onClick={() => setIsReceiptModalOpen(true)}
            className="h-10 px-4 flex items-center gap-2 bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-md shadow-[#0866ff]/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_box</span>
            <span>+ Nhập Kho</span>
          </button>
        </div>
      </div>

      {/* 2. Asymmetrical 12-Col Inventory Bento (5 + 4 + 3) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Hero Card: Tổng giá trị kho (5 cols) */}
        <div className="md:col-span-5 rounded-2xl saas-hero-gradient text-white p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 saas-subtle-grid pointer-events-none" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-blue-100/90">Tổng giá trị vốn tồn kho</span>
              <div className="text-2xl sm:text-3xl font-mono font-extrabold tabular-nums tracking-tight mt-1">
                {totalValue.toLocaleString('vi-VN')} ₫
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-xs">
              <span className="material-symbols-outlined text-[22px] text-white">
                account_balance_wallet
              </span>
            </div>
          </div>
          <div className="relative z-10 mt-4 pt-3.5 border-t border-white/15 flex items-center justify-between text-xs text-blue-50">
            <span>Tính theo giá vốn bình quân gia quyền</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/15 font-mono font-semibold">
              {pagination ? `${pagination.totalRecords} SKU tồn kho` : `${items.length} SKU`}
            </span>
          </div>
        </div>

        {/* Tile 2: Tổng mặt hàng SKU (4 cols) */}
        <div className="md:col-span-4 saas-card p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">Tổng mặt hàng SKU</span>
              <div className="text-2xl sm:text-3xl font-mono font-extrabold tabular-nums text-slate-900 mt-1">
                {pagination?.totalRecords || 0}{' '}
                <span className="text-sm font-sans font-medium text-slate-400">mã</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 text-[#0866ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">category</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Nhóm danh mục quản lý</span>
            <span className="font-mono font-bold text-[#0866ff]">{categories.length} nhóm</span>
          </div>
        </div>

        {/* Tile 3: Dưới mức an toàn (3 cols) */}
        <button
          type="button"
          onClick={() => setStockStatus(stockStatus === 'low' ? 'all' : 'low')}
          className={`md:col-span-3 text-left rounded-2xl p-5 border transition-all flex flex-col justify-between cursor-pointer ${
            stockStatus === 'low'
              ? 'bg-rose-50/90 border-rose-400 shadow-sm'
              : lowStockCount > 0
              ? 'bg-rose-50/45 border-rose-200/80 hover:border-rose-300'
              : 'bg-white border-slate-200/80 hover:border-blue-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">warning</span>
                Dưới mức an toàn
              </span>
              <div className="text-2xl sm:text-3xl font-mono font-extrabold tabular-nums text-rose-600 mt-1">
                {lowStockCount}{' '}
                <span className="text-xs font-sans font-medium text-rose-500">mặt hàng</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100/80 text-rose-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">inventory</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-rose-200/50 flex items-center justify-between text-xs">
            <span className="text-slate-500">Nhấn để lọc nhanh</span>
            <span className="text-rose-600 font-semibold">
              {stockStatus === 'low' ? 'Đang lọc' : 'Cần nhập thêm'}
            </span>
          </div>
        </button>
      </div>

      {/* 3. Thanh công cụ & Filter */}
      <div className="saas-card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="flex items-center gap-2 min-w-[260px] flex-1 sm:flex-initial h-9 px-3 rounded-xl bg-slate-50/80 border border-slate-200/80 focus-within:bg-white focus-within:border-[#0866ff] transition-all">
              <span className="material-symbols-outlined text-slate-500 text-[18px] shrink-0">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData(1)}
                placeholder="Tìm theo SKU, danh mục, thương hiệu..."
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

            <select
              id="inventory-filter-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-9 px-3 text-xs font-semibold text-slate-700 bg-slate-50/80 border border-slate-200/80 rounded-xl focus:border-[#0866ff] outline-none max-w-[220px] cursor-pointer"
            >
              <option value="all">Danh mục: Tất cả</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
              className="h-9 px-3 text-xs font-semibold text-slate-700 bg-slate-50/80 border border-slate-200/80 rounded-xl focus:border-[#0866ff] outline-none cursor-pointer"
            >
              <option value="all">Trạng thái: Tất cả</option>
              <option value="low">Sắp hết hàng</option>
              <option value="sufficient">Đủ tồn kho</option>
            </select>

            <button
              onClick={handleFilterReset}
              className="h-9 px-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 rounded-xl border border-dashed border-slate-300 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
              <span>Đặt lại</span>
            </button>
            <button
              onClick={() => loadData(1)}
              className="h-9 px-3.5 flex items-center gap-1.5 text-xs font-bold text-[#0866ff] bg-blue-50/80 hover:bg-blue-100/80 rounded-xl border border-blue-200/80 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">search</span>
              <span>Lọc</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Bảng dữ liệu */}
      <div className="saas-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[920px]">
            <thead>
              <tr className="h-11 bg-slate-50/90 border-b border-slate-200/80 text-xs text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-5 font-mono">Mã SKU</th>
                <th className="py-3 px-5 min-w-[240px]">Danh mục / Vật tư</th>
                <th className="py-3 px-5">Thương hiệu</th>
                <th className="py-3 px-5">Phân loại</th>
                <th className="py-3 px-5 text-right">Giá vốn TB</th>
                <th className="py-3 px-5 text-right">Giá bán</th>
                <th className="py-3 px-5 text-center">Tồn kho</th>
                <th className="py-3 px-5 text-center min-w-[140px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500 text-xs">
                    Đang tải dữ liệu tồn kho...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                    Không có mặt hàng phụ tùng nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLowStock = item.onHand < item.reorderLevel;
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isLowStock
                          ? 'bg-rose-50/35 hover:bg-rose-50/60'
                          : 'hover:bg-blue-50/25'
                      }`}
                    >
                      <td className="py-3.5 px-5 font-mono text-xs font-bold text-[#0866ff]">
                        {item.sku}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-900">
                          {item.partCategory?.name ?? item.name}
                        </div>
                        <div className="text-xs text-slate-600 font-medium mt-0.5">
                          <span className="font-mono text-slate-700">{item.partCategory?.code}</span> · ĐVT: {item.uom?.name}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        {item.brand ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-blue-50 text-[#0050cd] border border-blue-200/80">
                            {item.brand.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${
                            ITEM_TYPE_BADGE[item.itemType] || 'bg-slate-100 text-slate-700 border-slate-200/80'
                          }`}
                        >
                          {ITEM_TYPE_LABELS[item.itemType] || item.itemType}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono tabular-nums text-xs text-slate-700 font-medium">
                        {item.averageCost.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono tabular-nums font-bold text-slate-900">
                        {item.sellingPrice.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        {isLowStock ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 font-mono text-xs font-bold border border-rose-200">
                            <span className="material-symbols-outlined text-[14px]">warning</span>
                            {item.onHand}
                          </div>
                        ) : (
                          <span className="font-mono tabular-nums font-bold text-slate-800">
                            {item.onHand}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isLowStock && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200/80">
                              Sắp hết
                            </span>
                          )}
                          {!item.isActive && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500">
                              Ngừng bán
                            </span>
                          )}
                          <button
                            onClick={() => handleEditPart(item)}
                            className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 text-[#0866ff] flex items-center justify-center transition-colors cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <span className="material-symbols-outlined text-[17px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleToggleClick(item)}
                            className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200/80 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                            title={item.isActive ? 'Tạm ngưng' : 'Kích hoạt lại'}
                          >
                            <span className="material-symbols-outlined text-[17px]">
                              {item.isActive ? 'block' : 'check_circle'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80 bg-slate-50/40">
          <span className="text-xs text-slate-700">
            Hiển thị <span className="font-mono font-bold text-slate-900">{filteredItems.length}</span>{' '}
            trong tổng số{' '}
            <span className="font-mono font-bold text-slate-900">{pagination?.totalRecords || items.length}</span>{' '}
            phụ tùng
          </span>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => loadData(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
                title="Trang trước"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => loadData(page)}
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
                onClick={() => loadData(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={currentPage >= pagination.totalPages}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
                title="Trang sau"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <PartItemModal 
        isOpen={isPartModalOpen} 
        onClose={() => setIsPartModalOpen(false)} 
        item={selectedPart}
        onSuccess={loadData}
        categoryOptions={categories}
        brandOptions={brands}
      />



      <GoodsReceiptModal 
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onSuccess={loadData}
        inventoryItems={items}
      />

      <ConfirmModal 
        isOpen={isConfirmOpen}
        title={itemToToggle?.isActive ? "Ngừng kinh doanh phụ tùng" : "Kích hoạt phụ tùng"}
        message={`Bạn có chắc chắn muốn ${itemToToggle?.isActive ? 'ngừng' : 'kích hoạt lại'} mã SKU ${itemToToggle?.sku}?`}
        onConfirm={handleConfirmToggle}
        onCancel={() => setIsConfirmOpen(false)}
        confirmText="Đồng ý"
        isDestructive={itemToToggle?.isActive ? true : false}
      />

      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({...toast, show: false})} />
      )}
    </div>
  );
}
