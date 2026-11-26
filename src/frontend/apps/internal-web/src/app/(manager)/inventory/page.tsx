'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import StatusPill from '@/components/shared/StatusPill';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchInventoryItems,
  fetchAllInventoryItems,
  toggleInventoryItem,
  fetchPartCategories,
  fetchBrands,
  fetchReceipts,
  fetchSuppliers,
  postDraftReceipt,
  InventoryItem,
  GoodsReceipt,
  Supplier,
} from '@/store/slices/inventorySlice';
import ConfirmModal from '@/components/shared/ConfirmModal';

const PartItemModal = dynamic(
  () => import('./components/PartItemModal').then((m) => m.PartItemModal),
  { ssr: false }
);
const GoodsReceiptModal = dynamic(
  () => import('./components/GoodsReceiptModal').then((m) => m.GoodsReceiptModal),
  { ssr: false }
);
const GoodsReceiptDetailModal = dynamic(
  () => import('./components/GoodsReceiptDetailModal').then((m) => m.GoodsReceiptDetailModal),
  { ssr: false }
);
const StockCardModal = dynamic(
  () => import('./components/StockCardModal').then((m) => m.StockCardModal),
  { ssr: false }
);
const SupplierModal = dynamic(
  () => import('./components/SupplierModal').then((m) => m.SupplierModal),
  { ssr: false }
);

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

const RECEIPT_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  POSTED: {
    label: 'Đã ghi sổ',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  },
  DRAFT: {
    label: 'Bản nháp',
    className: 'bg-amber-50 text-amber-800 border-amber-200/80',
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'bg-rose-50 text-rose-700 border-rose-200/80',
  },
};

export default function InventoryPage() {
  const dispatch = useAppDispatch();
  const {
    items,
    allItems,
    itemsSummary,
    pagination,
    loading,
    error,
    categories,
    brands,
    receipts,
    receiptsStats,
    receiptsPagination,
    receiptsLoading,
    suppliers,
    suppliersLoading,
  } = useAppSelector((state) => state.inventory);

  // Active Workspace Tab: 'items' | 'receipts' | 'suppliers'
  const [activeTab, setActiveTab] = useState<'items' | 'receipts' | 'suppliers'>('items');

  // Tab 1: Inventory SKU Filters
  const [search, setSearch] = useState('');
  const [itemType, setItemType] = useState('all');
  const [categoryId, setCategoryId] = useState('all');
  const [stockStatus, setStockStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  // Tab 2: Goods Receipt Ledger Filters
  const [receiptSearch, setReceiptSearch] = useState('');
  const [receiptSupplierId, setReceiptSupplierId] = useState('all');
  const [receiptTypeFilter, setReceiptTypeFilter] = useState('all');
  const [receiptStatusFilter, setReceiptStatusFilter] = useState('all');
  const [receiptPage, setReceiptPage] = useState(1);

  // Tab 3: Supplier Filters
  const [supplierSearch, setSupplierSearch] = useState('');

  // Modals State
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<InventoryItem | null>(null);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [preselectLowStock, setPreselectLowStock] = useState(false);

  const [selectedReceipt, setSelectedReceipt] = useState<GoodsReceipt | null>(null);
  const [isReceiptDetailOpen, setIsReceiptDetailOpen] = useState(false);

  const [stockCardItem, setStockCardItem] = useState<InventoryItem | null>(null);
  const [isStockCardOpen, setIsStockCardOpen] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToToggle, setItemToToggle] = useState<InventoryItem | null>(null);
  const receiptsLoadedRef = useRef(false);
  const suppliersLoadedRef = useRef(false);

  useEffect(() => {
    loadData(1);
    dispatch(fetchPartCategories());
    dispatch(fetchBrands());
  }, []);

  useEffect(() => {
    if (activeTab === 'receipts' && !receiptsLoadedRef.current) {
      receiptsLoadedRef.current = true;
      loadReceipts(1);
      if (!suppliersLoadedRef.current) {
        suppliersLoadedRef.current = true;
        dispatch(fetchSuppliers());
      }
    } else if (activeTab === 'suppliers' && !suppliersLoadedRef.current) {
      suppliersLoadedRef.current = true;
      dispatch(fetchSuppliers());
    }
  }, [activeTab]);

  const loadData = (page = currentPage) => {
    setCurrentPage(page);
    dispatch(
      fetchInventoryItems({
        search: search || undefined,
        itemType: itemType !== 'all' ? itemType : undefined,
        partCategoryId: categoryId !== 'all' ? parseInt(categoryId, 10) : undefined,
        stockStatus: stockStatus !== 'all' ? stockStatus : undefined,
        page,
        limit,
      })
    );
  };

  const loadReceipts = (page = receiptPage) => {
    setReceiptPage(page);
    dispatch(
      fetchReceipts({
        page,
        limit: 10,
        search: receiptSearch || undefined,
        supplierId: receiptSupplierId !== 'all' ? parseInt(receiptSupplierId, 10) : undefined,
        receiptType: receiptTypeFilter !== 'all' ? receiptTypeFilter : undefined,
        status: receiptStatusFilter !== 'all' ? receiptStatusFilter : undefined,
      })
    );
  };

  const refreshAllInventoryData = useCallback(() => {
    loadData(currentPage);
    if (receiptsLoadedRef.current || activeTab === 'receipts') {
      loadReceipts(receiptPage);
    }
    if (suppliersLoadedRef.current || activeTab === 'suppliers') {
      dispatch(fetchSuppliers());
    }
  }, [activeTab, currentPage, receiptPage]);

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

  const handleReceiptFilterReset = () => {
    setReceiptSearch('');
    setReceiptSupplierId('all');
    setReceiptTypeFilter('all');
    setReceiptStatusFilter('all');
    setReceiptPage(1);
    setTimeout(() => {
      dispatch(fetchReceipts({ page: 1, limit: 10 }));
    }, 0);
  };

  // Warehouse-wide KPI source (uses allItems when available so pagination doesn't distort totals)
  const kpiSourceItems = useMemo(
    () => (allItems && allItems.length > 0 ? allItems : items),
    [allItems, items]
  );

  const lowStockCount = useMemo(
    () =>
      itemsSummary
        ? itemsSummary.lowStockCount
        : kpiSourceItems.filter((i) => i.isActive && i.onHand <= i.reorderLevel).length,
    [itemsSummary, kpiSourceItems]
  );

  const totalValue = useMemo(
    () =>
      itemsSummary
        ? itemsSummary.totalValue
        : kpiSourceItems.reduce((sum, item) => sum + item.onHand * item.averageCost, 0),
    [itemsSummary, kpiSourceItems]
  );

  // Use server-filtered items when itemsSummary is active; fallback to kpiSourceItems if allItems loaded
  const displayedItems = useMemo(() => {
    if (stockStatus === 'low') {
      return allItems && allItems.length > 0
        ? allItems.filter((item) => item.onHand <= item.reorderLevel)
        : items.filter((item) => item.onHand <= item.reorderLevel);
    }
    if (stockStatus === 'sufficient') {
      return items.filter((item) => item.onHand > item.reorderLevel);
    }
    return items;
  }, [items, allItems, stockStatus]);

  const filteredSuppliers = useMemo(() => {
    const q = supplierSearch.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.code || '').toLowerCase().includes(q) ||
        (s.taxCode || '').toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q) ||
        (s.contactPerson || '').toLowerCase().includes(q)
    );
  }, [suppliers, supplierSearch]);

  const handleAddPart = () => {
    setSelectedPart(null);
    setIsPartModalOpen(true);
  };

  const handleEditPart = (item: InventoryItem) => {
    setSelectedPart(item);
    setIsPartModalOpen(true);
  };

  const handleOpenStockCard = (item: InventoryItem) => {
    setStockCardItem(item);
    setIsStockCardOpen(true);
  };

  const handleOpenNewReceipt = (autoLowStock = false) => {
    setPreselectLowStock(autoLowStock);
    setIsReceiptModalOpen(true);
  };

  const handleQuickPostDraft = async (receipt: GoodsReceipt) => {
    const res = await dispatch(postDraftReceipt(receipt.id));
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success(`Đã ghi sổ phiếu ${receipt.receiptNumber} và cộng tồn kho thành công!`);
      refreshAllInventoryData();
    } else {
      toast.error((res.payload as string) || 'Lỗi khi ghi sổ phiếu nhập');
    }
  };

  const handleToggleClick = (item: InventoryItem) => {
    setItemToToggle(item);
    setIsConfirmOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!itemToToggle) return;
    const res = await dispatch(toggleInventoryItem(itemToToggle.id));
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Cập nhật trạng thái thành công');
      loadData(currentPage);
      dispatch(fetchAllInventoryItems());
    } else {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
    setIsConfirmOpen(false);
  };

  return (
    <div className="flex flex-col min-w-0 space-y-6">
      {/* 1. Asymmetrical 12-Col Inventory Bento (5 + 4 + 3) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Hero Card: Tổng giá trị kho (5 cols) */}
        <div className="md:col-span-5 rounded-2xl saas-hero-gradient text-white p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 saas-subtle-grid pointer-events-none" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-blue-100/90">Tổng giá trị vốn tồn kho</span>
              <div className="text-2xl sm:text-3xl font-mono font-extrabold tabular-nums tracking-tight mt-1">
                {Math.round(totalValue).toLocaleString('vi-VN')} ₫
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
              {pagination ? `${pagination.totalRecords} SKU tồn kho` : `${kpiSourceItems.length} SKU`}
            </span>
          </div>
        </div>

        {/* Tile 2: Sổ Phiếu Nhập & SKU (4 cols) */}
        <div className="md:col-span-4 saas-card p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">
                Tổng mặt hàng SKU & Chứng từ nhập
              </span>
              <div className="text-2xl sm:text-3xl font-mono font-extrabold tabular-nums text-slate-900 mt-1">
                {pagination?.totalRecords || kpiSourceItems.length}{' '}
                <span className="text-sm font-sans font-medium text-slate-400">mã SKU</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 text-[#0866ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Đã ghi sổ: <strong className="text-slate-800">{receiptsStats?.postedCount || 0}</strong>{' '}
              phiếu
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('receipts')}
              className="font-mono font-bold text-[#0866ff] hover:underline cursor-pointer"
            >
              Mở Sổ Nhập Kho →
            </button>
          </div>
        </div>

        {/* Tile 3: Dưới mức an toàn (3 cols) */}
        <button
          type="button"
          onClick={() => {
            const nextStatus = stockStatus === 'low' ? 'all' : 'low';
            setActiveTab('items');
            setStockStatus(nextStatus);
            setCurrentPage(1);
            dispatch(
              fetchInventoryItems({
                search: search || undefined,
                itemType: itemType !== 'all' ? itemType : undefined,
                partCategoryId: categoryId !== 'all' ? parseInt(categoryId, 10) : undefined,
                stockStatus: nextStatus !== 'all' ? nextStatus : undefined,
                page: 1,
                limit,
              })
            );
          }}
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

      {/* 3. Enterprise 3-Tab Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/90 pb-2">
        <div role="tablist" aria-label="Phân hệ kho phụ tùng" className="flex flex-wrap items-center gap-1.5 overflow-x-auto max-w-full">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'items'}
            onClick={() => setActiveTab('items')}
            className={`min-h-[44px] lg:min-h-[40px] px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'items'
                ? 'bg-[#0866ff] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">inventory_2</span>
            <span>Danh mục Tồn kho ({pagination?.totalRecords || kpiSourceItems.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'receipts'}
            onClick={() => setActiveTab('receipts')}
            className={`min-h-[44px] lg:min-h-[40px] px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'receipts'
                ? 'bg-[#0866ff] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">receipt_long</span>
            <span>Sổ Phiếu Nhập Kho ({receiptsStats?.totalReceipts || receipts.length})</span>
            {receiptsStats && receiptsStats.draftCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                activeTab === 'receipts'
                  ? 'bg-white/20 text-white border-white/30'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {receiptsStats.draftCount} nháp
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'suppliers'}
            onClick={() => setActiveTab('suppliers')}
            className={`min-h-[44px] lg:min-h-[40px] px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'suppliers'
                ? 'bg-[#0866ff] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">local_shipping</span>
            <span>Nhà cung cấp ({suppliers.length})</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {lowStockCount > 0 && (
            <button
              type="button"
              onClick={() => handleOpenNewReceipt(true)}
              className="h-10 px-3.5 flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Lập nhanh phiếu nhập kho cho toàn bộ các mã đang chạm/dưới định mức an toàn"
            >
              <span className="material-symbols-outlined text-[18px] text-amber-600">bolt</span>
              <span>Nhập bù hàng thiếu ({lowStockCount})</span>
            </button>
          )}
          <button
            id="btn-add-part"
            onClick={handleAddPart}
            className="h-10 px-4 flex items-center gap-2 bg-white text-slate-700 hover:text-[#0866ff] border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/40 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-[#0866ff]">add</span>
            <span>Thêm phụ tùng</span>
          </button>
          <button
            id="btn-create-receipt"
            type="button"
            onClick={() => handleOpenNewReceipt(false)}
            className="h-10 px-4 flex items-center gap-2 bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-md shadow-[#0866ff]/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_box</span>
            <span>Nhập kho</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          TAB 1: DANH MỤC TỒN KHO SKU
      ========================================================= */}
      {activeTab === 'items' && (
        <>
          <div className="saas-card p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="flex items-center gap-2 w-full sm:w-auto sm:min-w-[260px] flex-1 sm:flex-initial h-9 px-3 rounded-xl bg-slate-50/80 border border-slate-200/80 focus-within:bg-white focus-within:border-[#0866ff] transition-all">
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
                  onChange={(e) => {
                    const nextStatus = e.target.value;
                    setStockStatus(nextStatus);
                    setCurrentPage(1);
                    dispatch(
                      fetchInventoryItems({
                        search: search || undefined,
                        itemType: itemType !== 'all' ? itemType : undefined,
                        partCategoryId: categoryId !== 'all' ? parseInt(categoryId, 10) : undefined,
                        stockStatus: nextStatus !== 'all' ? nextStatus : undefined,
                        page: 1,
                        limit,
                      })
                    );
                  }}
                  className="h-9 px-3 text-xs font-semibold text-slate-700 bg-slate-50/80 border border-slate-200/80 rounded-xl focus:border-[#0866ff] outline-none cursor-pointer"
                >
                  <option value="all">Trạng thái: Tất cả</option>
                  <option value="low">Sắp hết hàng (≤ Định mức)</option>
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

          <div className="saas-card overflow-hidden">
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left border-collapse min-w-[940px]">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                  <tr className="h-11 border-b border-slate-200/80 text-xs text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-5 font-mono">Mã SKU</th>
                    <th className="py-3 px-5 min-w-[240px]">Danh mục / Vật tư</th>
                    <th className="py-3 px-5">Thương hiệu</th>
                    <th className="py-3 px-5">Phân loại</th>
                    <th className="py-3 px-5 text-right">Giá vốn TB</th>
                    <th className="py-3 px-5 text-right">Giá bán</th>
                    <th className="py-3 px-5 text-center">Tồn kho</th>
                    <th className="py-3 px-5 text-center min-w-[160px]">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 text-sm">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={`skeleton-${idx}`} className="animate-pulse">
                        <td className="py-3.5 px-5"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                        <td className="py-3.5 px-5"><div className="h-4 w-44 bg-slate-200 rounded" /></td>
                        <td className="py-3.5 px-5"><div className="h-5 w-20 bg-slate-100 rounded-lg" /></td>
                        <td className="py-3.5 px-5"><div className="h-5 w-24 bg-slate-100 rounded-lg" /></td>
                        <td className="py-3.5 px-5 text-right"><div className="h-4 w-16 bg-slate-200 rounded ml-auto" /></td>
                        <td className="py-3.5 px-5 text-right"><div className="h-4 w-16 bg-slate-200 rounded ml-auto" /></td>
                        <td className="py-3.5 px-5 text-center"><div className="h-5 w-10 bg-slate-200 rounded-full mx-auto" /></td>
                        <td className="py-3.5 px-5 text-center"><div className="h-8 w-32 bg-slate-100 rounded-xl mx-auto" /></td>
                      </tr>
                    ))
                  ) : error ? (
                    <tr>
                      <td colSpan={8} className="py-10 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-2.5 text-rose-700 bg-rose-50/70 border border-rose-200 rounded-2xl px-6 py-5">
                          <span className="material-symbols-outlined text-[28px] text-rose-600">error</span>
                          <span className="text-xs font-semibold">Không thể tải dữ liệu tồn kho: {error}</span>
                          <button
                            type="button"
                            onClick={() => loadData(currentPage)}
                            className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">refresh</span>
                            <span>Thử lại</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : displayedItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                        Không có mặt hàng phụ tùng nào phù hợp
                      </td>
                    </tr>
                  ) : (
                    displayedItems.map((item) => {
                      const isLowStock = item.onHand <= item.reorderLevel;
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
                              <span className="font-mono text-slate-700">
                                {item.partCategory?.code}
                              </span>{' '}
                              · ĐVT: {item.uom?.name} · ĐM an toàn: {item.reorderLevel}
                            </div>
                          </td>
                          <td className="py-3.5 px-5">
                            {item.brand ? (
                              <StatusPill label={item.brand.name} tone="primary" />
                            ) : (
                              <span className="text-slate-400 font-medium">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-5">
                            <StatusPill
                              label={ITEM_TYPE_LABELS[item.itemType] || item.itemType}
                              tone={
                                item.itemType === 'PART'
                                  ? 'primary'
                                  : item.itemType === 'CONSUMABLE'
                                    ? 'warning'
                                    : item.itemType === 'CHEMICAL'
                                      ? 'purple'
                                      : 'sky'
                              }
                            />
                          </td>
                          <td className="py-3.5 px-5 text-right font-mono tabular-nums text-xs text-slate-700 font-medium">
                            {Math.round(item.averageCost).toLocaleString('vi-VN')} ₫
                          </td>
                          <td className="py-3.5 px-5 text-right font-mono tabular-nums font-bold text-slate-900">
                            {item.sellingPrice.toLocaleString('vi-VN')} ₫
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            {isLowStock ? (
                              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 font-mono text-xs font-bold border border-rose-200">
                                <span className="material-symbols-outlined text-[14px]">
                                  warning
                                </span>
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
                              <button
                                type="button"
                                onClick={() => handleOpenStockCard(item)}
                                className="h-8 px-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 text-slate-700 hover:text-indigo-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Xem Thẻ kho (Lịch sử biến động)"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  history
                                </span>
                                <span>Thẻ kho</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditPart(item)}
                                aria-label={`Chỉnh sửa ${item.name}`}
                                className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 text-[#0866ff] flex items-center justify-center transition-colors cursor-pointer"
                                title="Chỉnh sửa"
                              >
                                <span className="material-symbols-outlined text-[17px]">edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleClick(item)}
                                aria-label={item.isActive ? `Tạm ngưng ${item.name}` : `Kích hoạt lại ${item.name}`}
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
                Hiển thị{' '}
                <span className="font-mono font-bold text-slate-900">{displayedItems.length}</span>{' '}
                trong tổng số{' '}
                <span className="font-mono font-bold text-slate-900">
                  {pagination?.totalRecords || items.length}
                </span>{' '}
                phụ tùng
              </span>
              {stockStatus !== 'low' && pagination && pagination.totalPages > 1 && (
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
        </>
      )}

      {/* =========================================================
          TAB 2: SỔ PHIẾU NHẬP KHO (GOODS RECEIPT LEDGER)
      ========================================================= */}
      {activeTab === 'receipts' && (
        <>
          <div className="saas-card p-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 w-full sm:w-auto sm:min-w-[260px] flex-1 sm:flex-initial h-9 px-3 rounded-xl bg-slate-50/80 border border-slate-200/80 focus-within:bg-white focus-within:border-[#0866ff]">
                <span className="material-symbols-outlined text-slate-500 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={receiptSearch}
                  onChange={(e) => setReceiptSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadReceipts(1)}
                  placeholder="Tìm mã phiếu GR, số hóa đơn VAT, nhà cung cấp..."
                  className="flex-1 bg-transparent text-xs text-slate-900 placeholder:text-slate-500 outline-none"
                />
              </div>

              <select
                value={receiptSupplierId}
                onChange={(e) => setReceiptSupplierId(e.target.value)}
                className="h-9 px-3 text-xs font-semibold text-slate-700 bg-slate-50/80 border border-slate-200/80 rounded-xl outline-none max-w-[220px] cursor-pointer"
              >
                <option value="all">Nhà cung cấp: Tất cả</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={receiptStatusFilter}
                onChange={(e) => setReceiptStatusFilter(e.target.value)}
                className="h-9 px-3 text-xs font-semibold text-slate-700 bg-slate-50/80 border border-slate-200/80 rounded-xl outline-none cursor-pointer"
              >
                <option value="all">Trạng thái: Tất cả</option>
                <option value="POSTED">Đã ghi sổ</option>
                <option value="DRAFT">Bản nháp</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>

              <button
                type="button"
                onClick={handleReceiptFilterReset}
                className="h-9 px-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl border border-dashed border-slate-300 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                <span>Đặt lại</span>
              </button>

              <button
                type="button"
                onClick={() => loadReceipts(1)}
                className="h-9 px-3.5 flex items-center gap-1.5 text-xs font-bold text-[#0866ff] bg-blue-50/80 hover:bg-blue-100/80 rounded-xl border border-blue-200/80 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">search</span>
                <span>Tra cứu</span>
              </button>
            </div>
          </div>

          <div className="saas-card overflow-hidden">
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left border-collapse min-w-[940px]">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                  <tr className="h-11 border-b border-slate-200/80 text-xs text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-5 font-mono">Số Phiếu Nhập</th>
                    <th className="py-3 px-5">Ngày nhập</th>
                    <th className="py-3 px-5">Nhà cung cấp / Loại</th>
                    <th className="py-3 px-5">Số Hóa đơn VAT</th>
                    <th className="py-3 px-5 text-center">Mặt hàng</th>
                    <th className="py-3 px-5 text-right">Tổng thanh toán</th>
                    <th className="py-3 px-5 text-center">Trạng thái</th>
                    <th className="py-3 px-5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 text-sm">
                  {receiptsLoading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-500 text-xs">
                        Đang tải sổ chứng từ phiếu nhập kho...
                      </td>
                    </tr>
                  ) : receipts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                        Không tìm thấy phiếu nhập kho nào phù hợp
                      </td>
                    </tr>
                  ) : (
                    receipts.map((r) => {
                      const statusBadge =
                        RECEIPT_STATUS_BADGE[r.status] || RECEIPT_STATUS_BADGE.POSTED;
                      const totalQty = r.items.reduce((acc, i) => acc + i.quantity, 0);
                      return (
                        <tr key={r.id} className="hover:bg-blue-50/25 transition-colors">
                          <td className="py-3.5 px-5">
                            <span className="font-mono text-xs font-bold text-[#0866ff]">
                              {r.receiptNumber}
                            </span>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Lập bởi: {r.createdBy?.fullName || 'Quản lý kho'}
                            </div>
                          </td>
                          <td className="py-3.5 px-5 font-mono text-xs text-slate-700">
                            {new Date(r.receivedDate).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="font-semibold text-slate-900">
                              {r.supplier?.name || '— Nhập tồn đầu kỳ —'}
                            </div>
                            <span className="text-xs text-slate-500">
                              {r.receiptType === 'OPENING_STOCK'
                                ? 'Nhập số dư đầu kỳ'
                                : 'Nhập mua hàng NCC'}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 font-mono text-xs font-semibold text-slate-700">
                            {r.referenceNo || '—'}
                          </td>
                          <td className="py-3.5 px-5 text-center text-xs">
                            <span className="font-mono font-bold text-slate-900">
                              {r.items.length} SKU
                            </span>
                            <div className="text-[11px] text-slate-500 font-mono">
                              Tổng SL: {totalQty}
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-right font-mono font-extrabold text-slate-900">
                            {r.grandTotal.toLocaleString('vi-VN')} ₫
                            {r.taxRate > 0 && (
                              <div className="text-[10px] font-normal text-slate-500">
                                Đã gồm VAT {r.taxRate}%
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadge.className}`}
                            >
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {r.status === 'DRAFT' && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickPostDraft(r)}
                                  className="h-8 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Xác nhận ghi sổ và cộng tồn kho ngay"
                                >
                                  <span className="material-symbols-outlined text-[15px]">
                                    verified
                                  </span>
                                  <span>Ghi sổ</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReceipt(r);
                                  setIsReceiptDetailOpen(true);
                                }}
                                className="h-8 px-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 text-[#0866ff] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  visibility
                                </span>
                                <span>Chi tiết / In</span>
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

            <div className="px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80 bg-slate-50/40">
              <span className="text-xs text-slate-700">
                Hiển thị <span className="font-mono font-bold text-slate-900">{receipts.length}</span>{' '}
                trong tổng số{' '}
                <span className="font-mono font-bold text-slate-900">
                  {receiptsPagination?.totalRecords || receipts.length}
                </span>{' '}
                phiếu nhập kho
              </span>
              {receiptsPagination && receiptsPagination.totalPages > 1 && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: receiptsPagination.totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => loadReceipts(p)}
                        className={`w-8 h-8 rounded-lg font-mono text-xs font-semibold cursor-pointer ${
                          p === receiptPage
                            ? 'bg-[#0866ff] text-white'
                            : 'bg-white border border-slate-200 text-slate-800'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* =========================================================
          TAB 3: QUẢN LÝ NHÀ CUNG CẤP (SUPPLIERS)
      ========================================================= */}
      {activeTab === 'suppliers' && (
        <>
          <div className="saas-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto sm:min-w-[280px] h-9 px-3 rounded-xl bg-slate-50/80 border border-slate-200/80 focus-within:bg-white focus-within:border-[#0866ff]">
              <span className="material-symbols-outlined text-slate-500 text-[18px]">search</span>
              <input
                type="text"
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                placeholder="Tìm theo mã NCC, tên công ty, mã số thuế, SĐT..."
                className="flex-1 bg-transparent text-xs text-slate-900 placeholder:text-slate-500 outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedSupplier(null);
                setIsSupplierModalOpen(true);
              }}
              className="h-9 px-4 rounded-xl bg-[#0866ff] hover:bg-[#0050cd] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">domain_add</span>
              <span>+ Thêm Nhà cung cấp</span>
            </button>
          </div>

          <div className="saas-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[880px]">
                <thead>
                  <tr className="h-11 bg-slate-50/90 border-b border-slate-200/80 text-xs text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-5 font-mono">Mã NCC</th>
                    <th className="py-3 px-5">Tên Nhà cung cấp / Địa chỉ</th>
                    <th className="py-3 px-5">Mã số thuế</th>
                    <th className="py-3 px-5">Đại diện liên hệ</th>
                    <th className="py-3 px-5 text-center">Số phiếu nhập</th>
                    <th className="py-3 px-5 text-right">Tổng giá trị đã nhập</th>
                    <th className="py-3 px-5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 text-sm">
                  {suppliersLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-500 text-xs">
                        Đang tải danh sách nhà cung cấp...
                      </td>
                    </tr>
                  ) : filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                        Không tìm thấy nhà cung cấp nào
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((s) => (
                      <tr key={s.id} className="hover:bg-blue-50/25 transition-colors">
                        <td className="py-3.5 px-5 font-mono text-xs font-bold text-[#0866ff]">
                          {s.code || `NCC-${String(s.id).padStart(3, '0')}`}
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-slate-900">{s.name}</div>
                          <div className="text-xs text-slate-500">{s.address || s.email || '—'}</div>
                        </td>
                        <td className="py-3.5 px-5 font-mono text-xs text-slate-700">
                          {s.taxCode || '—'}
                        </td>
                        <td className="py-3.5 px-5 text-xs">
                          <div className="font-semibold text-slate-800">
                            {s.contactPerson || '—'}
                          </div>
                          <div className="font-mono text-slate-500">{s.phone || ''}</div>
                        </td>
                        <td className="py-3.5 px-5 text-center font-mono font-bold text-slate-800">
                          {s.receiptCount || 0}
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono font-bold text-[#0050cd]">
                          {(s.totalPurchaseValue || 0).toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <button
                            type="button"
                            aria-label={`Chỉnh sửa nhà cung cấp ${s.name}`}
                            onClick={() => {
                              setSelectedSupplier(s);
                              setIsSupplierModalOpen(true);
                            }}
                            className="w-8 h-8 mx-auto rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 text-[#0866ff] flex items-center justify-center transition-colors cursor-pointer"
                            title="Chỉnh sửa nhà cung cấp"
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
          </div>
        </>
      )}

      {/* Modals (lazy-loaded & conditionally mounted) */}
      {isPartModalOpen && (
        <PartItemModal
          isOpen={isPartModalOpen}
          onClose={() => setIsPartModalOpen(false)}
          item={selectedPart}
          onSuccess={refreshAllInventoryData}
          categoryOptions={categories}
          brandOptions={brands}
        />
      )}

      {isReceiptModalOpen && (
        <GoodsReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setPreselectLowStock(false);
          }}
          onSuccess={refreshAllInventoryData}
          inventoryItems={kpiSourceItems}
          preselectedLowStock={preselectLowStock}
        />
      )}

      {isReceiptDetailOpen && (
        <GoodsReceiptDetailModal
          isOpen={isReceiptDetailOpen}
          onClose={() => setIsReceiptDetailOpen(false)}
          receipt={selectedReceipt}
          onUpdated={refreshAllInventoryData}
        />
      )}

      {isStockCardOpen && (
        <StockCardModal
          isOpen={isStockCardOpen}
          onClose={() => setIsStockCardOpen(false)}
          item={stockCardItem}
        />
      )}

      {isSupplierModalOpen && (
        <SupplierModal
          isOpen={isSupplierModalOpen}
          onClose={() => setIsSupplierModalOpen(false)}
          supplier={selectedSupplier}
          onSuccess={() => dispatch(fetchSuppliers())}
        />
      )}

      {isConfirmOpen && (
        <ConfirmModal
          isOpen={isConfirmOpen}
          title={itemToToggle?.isActive ? 'Ngừng kinh doanh phụ tùng' : 'Kích hoạt phụ tùng'}
          message={`Bạn có chắc chắn muốn ${
            itemToToggle?.isActive ? 'ngừng' : 'kích hoạt lại'
          } mã SKU ${itemToToggle?.sku}?`}
          onConfirm={handleConfirmToggle}
          onCancel={() => setIsConfirmOpen(false)}
          confirmText="Đồng ý"
          isDestructive={itemToToggle?.isActive ? true : false}
        />
      )}
    </div>
  );
}
