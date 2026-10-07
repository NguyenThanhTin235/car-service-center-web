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

export default function InventoryPage() {
  const dispatch = useAppDispatch();
  const { items, pagination, loading, categories, brands, uoms } = useAppSelector(state => state.inventory);

  const [search, setSearch] = useState('');
  const [itemType, setItemType] = useState('all');
  const [categoryId, setCategoryId] = useState('all');
  const [stockStatus, setStockStatus] = useState('all');
  
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<InventoryItem | null>(null);


  
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToToggle, setItemToToggle] = useState<InventoryItem | null>(null);
  
  const [toast, setToast] = useState<{show: boolean, type: 'success' | 'error', message: string}>({ show: false, type: 'success', message: '' });

  useEffect(() => {
    loadData();
    dispatch(fetchPartCategories());
    dispatch(fetchBrands());
    dispatch(fetchUoms());
  }, []);

  const loadData = () => {
    dispatch(fetchInventoryItems({
      search: search || undefined,
      itemType: itemType !== 'all' ? itemType : undefined,
      partCategoryId: categoryId !== 'all' ? parseInt(categoryId) : undefined,
      page: 1, limit: 50
    }));
  };

  const handleFilterReset = () => {
    setSearch('');
    setItemType('all');
    setCategoryId('all');
    setStockStatus('all');
    setTimeout(() => {
      dispatch(fetchInventoryItems({ page: 1, limit: 50 }));
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
      {/* 1. Header & Quick stats */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-headline-lg font-headline-lg text-on-surface tracking-tight">Quản lý kho phụ tùng</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline mb-2">
              <span className="text-label-sm font-label-sm uppercase tracking-wider">Tổng mặt hàng SKU</span>
              <div className="p-2 rounded-lg bg-surface-container-low text-primary">
                <span className="material-symbols-outlined text-[20px]">category</span>
              </div>
            </div>
            <div>
              <div className="text-numeric-metric font-numeric-metric text-on-surface">{pagination?.totalRecords || 0} <span className="text-label-md font-normal text-outline">mã</span></div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-5 border border-[#FCA5A5] shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-error-container/30 rounded-bl-full pointer-events-none"></div>
            <div className="flex items-center justify-between text-outline mb-2">
              <span className="text-label-sm font-label-sm uppercase tracking-wider text-error font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                Dưới mức an toàn
              </span>
              <div className="p-2 rounded-lg bg-[#FEE2E2] text-error">
                <span className="material-symbols-outlined text-[20px]">inventory</span>
              </div>
            </div>
            <div>
              <div className="text-numeric-metric font-numeric-metric text-error">{lowStockCount} <span className="text-label-md font-normal text-error/80">mặt hàng</span></div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline mb-2">
              <span className="text-label-sm font-label-sm uppercase tracking-wider">Tổng giá trị kho</span>
              <div className="p-2 rounded-lg bg-surface-container-low text-primary-container">
                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              </div>
            </div>
            <div>
              <div className="text-numeric-metric font-numeric-metric text-on-surface">
                {totalValue.toLocaleString()} ₫
              </div>
            </div>
          </div>


        </div>
      </div>

      {/* 2. Thanh công cụ & Filter */}
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
                onKeyDown={e => e.key === 'Enter' && loadData()}
                placeholder="Tìm theo SKU, danh mục, thương hiệu..."
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

            <select 
              id="inventory-filter-category"
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="h-9 px-3 text-label-sm bg-surface-container-lowest border border-[#D8DADF] rounded-md outline-none max-w-[220px]"
            >
              <option value="all">Danh mục: Tất cả</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select 
              value={stockStatus}
              onChange={e => setStockStatus(e.target.value)}
              className="h-9 px-3 text-label-sm bg-surface-container-lowest border border-[#D8DADF] rounded-md outline-none"
            >
              <option value="all">Trạng thái: Tất cả</option>
              <option value="low">Sắp hết hàng</option>
              <option value="sufficient">Đủ tồn kho</option>
            </select>

            <button onClick={handleFilterReset} className="h-9 px-3 flex items-center gap-1.5 text-label-sm text-on-surface-variant hover:bg-surface-container-low rounded-md border border-dashed border-[#D8DADF]">
              <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
              Đặt lại
            </button>
            <button onClick={loadData} className="h-9 px-3 flex items-center gap-1.5 text-label-sm text-primary hover:bg-surface-container-low rounded-md border border-[#D8DADF]">
              <span className="material-symbols-outlined text-[16px]">search</span>
              Lọc
            </button>
          </div>
          
          <div className="flex items-center gap-2 self-end lg:self-center">

            <button id="btn-add-part" onClick={handleAddPart} className="h-9 px-3.5 flex items-center gap-2 bg-surface-container-lowest text-on-surface border border-outline-variant hover:bg-surface-container-low rounded-md text-label-md font-medium shadow-sm transition-colors">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Thêm Phụ tùng
            </button>
            <button onClick={() => setIsReceiptModalOpen(true)} className="h-9 px-4 flex items-center gap-2 bg-primary-container text-on-primary hover:bg-primary rounded-md text-label-md font-medium shadow-sm transition-colors">
              <span className="material-symbols-outlined text-[18px]">add_box</span>
              Nhập Kho
            </button>
          </div>
        </div>
      </div>

      {/* 3. Bảng dữ liệu */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-[#E4E6EB] text-label-sm text-outline h-10">
                <th className="py-2.5 px-4 font-semibold uppercase">Mã SKU</th>
                <th className="py-2.5 px-4 font-semibold uppercase min-w-[240px]">Danh mục / Vật tư</th>
                <th className="py-2.5 px-4 font-semibold uppercase">Thương hiệu</th>
                <th className="py-2.5 px-4 font-semibold uppercase">Phân loại</th>
                <th className="py-2.5 px-4 font-semibold uppercase text-right">Giá vốn TB</th>
                <th className="py-2.5 px-4 font-semibold uppercase text-right">Giá bán</th>
                <th className="py-2.5 px-4 font-semibold uppercase text-center">Tồn kho</th>
                <th className="py-2.5 px-4 font-semibold uppercase text-center min-w-[160px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E6EB] text-body-md">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8">Đang tải...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8">Không có dữ liệu</td></tr>
              ) : filteredItems.map(item => {
                const isLowStock = item.onHand < item.reorderLevel;
                return (
                  <tr key={item.id} className={`hover:bg-[#F0F2F5] transition-colors ${isLowStock ? 'bg-[#FEF2F2] border-l-4 border-l-error' : ''}`}>
                    <td className="py-3 px-4 font-medium text-on-surface">{item.sku}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-on-surface">{item.partCategory?.name ?? item.name}</div>
                      <div className="text-body-sm text-outline">{item.partCategory?.code} · ĐVT: {item.uom?.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      {item.brand ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-label-sm font-medium bg-primary-container/10 text-primary">
                          {item.brand.name}
                        </span>
                      ) : (
                        <span className="text-outline">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-label-sm font-medium bg-surface-container-high text-on-surface-variant">
                        {item.itemType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-outline">{item.averageCost.toLocaleString()} ₫</td>
                    <td className="py-3 px-4 text-right font-semibold text-on-surface">{item.sellingPrice.toLocaleString()} ₫</td>
                    <td className="py-3 px-4 text-center">
                      {isLowStock ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FEE2E2] text-error font-bold border border-[#FECACA]">
                          <span className="material-symbols-outlined text-[14px]">warning</span>
                          {item.onHand}
                        </div>
                      ) : (
                        <span className="font-semibold text-[15px]">{item.onHand}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {isLowStock && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]">
                            Sắp hết
                          </span>
                        )}
                        {!item.isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container-high text-outline">
                            Ngừng bán
                          </span>
                        )}
                        <button onClick={() => handleEditPart(item)} className="p-1 text-primary hover:bg-surface-container-low rounded" title="Chỉnh sửa">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => handleToggleClick(item)} className="p-1 text-outline hover:text-error rounded" title={item.isActive ? "Tạm ngưng" : "Kích hoạt lại"}>
                          <span className="material-symbols-outlined text-[18px]">{item.isActive ? 'block' : 'check_circle'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
