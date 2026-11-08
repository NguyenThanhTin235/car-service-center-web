'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  createReceipt,
  fetchSuppliers,
  fetchAllInventoryItems,
  createSupplier,
  InventoryItem,
} from '@/store/slices/inventorySlice';
import Modal from '@/components/shared/Modal';
import Toast from '@/components/shared/Toast';

interface GoodsReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  inventoryItems: InventoryItem[];
  preselectedLowStock?: boolean;
}

interface ReceiptLineForm {
  itemId: string;
  quantity: string;
  unitCost: string;
  discountRate: string;
  updateSellingPrice: string;
}

export function GoodsReceiptModal({
  isOpen,
  onClose,
  onSuccess,
  inventoryItems,
  preselectedLowStock = false,
}: GoodsReceiptModalProps) {
  const dispatch = useAppDispatch();
  const { suppliers, allItems, actionLoading, actionError } = useAppSelector(
    (state) => state.inventory
  );

  // Use full warehouse catalog if loaded, fallback to current page items
  const catalogItems = useMemo(
    () => (allItems && allItems.length > 0 ? allItems : inventoryItems).filter((i) => i.isActive),
    [allItems, inventoryItems]
  );

  const [formData, setFormData] = useState({
    supplierId: '',
    receiptType: 'PURCHASE' as 'PURCHASE' | 'OPENING_STOCK',
    referenceNo: '',
    receivedDate: new Date().toISOString().split('T')[0],
    taxRate: '8',
    notes: '',
  });

  const [lines, setLines] = useState<ReceiptLineForm[]>([
    { itemId: '', quantity: '1', unitCost: '0', discountRate: '0', updateSellingPrice: '' },
  ]);

  // Quick search SKU bar
  const [skuSearch, setSkuSearch] = useState('');
  const [showQuickAddDropdown, setShowQuickAddDropdown] = useState(false);

  // Quick Supplier creation inline panel
  const [showQuickSupplier, setShowQuickSupplier] = useState(false);
  const [quickSupplier, setQuickSupplier] = useState({
    name: '',
    taxCode: '',
    contactPerson: '',
    phone: '',
  });
  const [creatingSupplier, setCreatingSupplier] = useState(false);

  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchSuppliers());
      dispatch(fetchAllInventoryItems());
      setFormData({
        supplierId: '',
        receiptType: 'PURCHASE',
        referenceNo: '',
        receivedDate: new Date().toISOString().split('T')[0],
        taxRate: '8',
        notes: '',
      });
      setSkuSearch('');
      setShowQuickSupplier(false);

      if (preselectedLowStock) {
        setTimeout(() => handleAutoFillLowStock(), 150);
      } else {
        setLines([
          { itemId: '', quantity: '1', unitCost: '0', discountRate: '0', updateSellingPrice: '' },
        ]);
      }
    }
  }, [isOpen, dispatch, preselectedLowStock]);

  const lowStockCatalog = useMemo(
    () => catalogItems.filter((item) => item.onHand <= item.reorderLevel),
    [catalogItems]
  );

  const quickSearchMatchedItems = useMemo(() => {
    const q = skuSearch.trim().toLowerCase();
    if (!q) return catalogItems.slice(0, 8);
    return catalogItems
      .filter(
        (item) =>
          item.sku.toLowerCase().includes(q) ||
          (item.partCategory?.name || item.name).toLowerCase().includes(q) ||
          (item.brand?.name || '').toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [catalogItems, skuSearch]);

  const handleAutoFillLowStock = () => {
    const source = (allItems && allItems.length > 0 ? allItems : inventoryItems).filter(
      (i) => i.isActive && i.onHand <= i.reorderLevel
    );
    if (source.length === 0) {
      setToast({
        show: true,
        type: 'error',
        message: 'Hiện tất cả phụ tùng trong kho đều đang trên mức an toàn!',
      });
      return;
    }

    const autoLines: ReceiptLineForm[] = source.map((item) => {
      const suggestedQty = Math.max(5, item.reorderLevel * 2 - item.onHand);
      return {
        itemId: item.id.toString(),
        quantity: suggestedQty.toString(),
        unitCost: Math.round(item.averageCost || 0).toString(),
        discountRate: '0',
        updateSellingPrice: '',
      };
    });
    setLines(autoLines);
    setToast({
      show: true,
      type: 'success',
      message: `Đã tự động điền ${autoLines.length} mã phụ tùng chạm/dưới định mức an toàn`,
    });
  };

  const handleQuickSelectSku = (item: InventoryItem) => {
    const existingIndex = lines.findIndex((l) => l.itemId === item.id.toString());
    if (existingIndex >= 0) {
      const updated = [...lines];
      const currentQty = parseInt(updated[existingIndex].quantity || '0', 10) || 0;
      updated[existingIndex].quantity = (currentQty + 1).toString();
      setLines(updated);
    } else if (lines.length === 1 && !lines[0].itemId) {
      setLines([
        {
          itemId: item.id.toString(),
          quantity: '10',
          unitCost: Math.round(item.averageCost || 0).toString(),
          discountRate: '0',
          updateSellingPrice: '',
        },
      ]);
    } else {
      setLines([
        ...lines,
        {
          itemId: item.id.toString(),
          quantity: '10',
          unitCost: Math.round(item.averageCost || 0).toString(),
          discountRate: '0',
          updateSellingPrice: '',
        },
      ]);
    }
    setSkuSearch('');
    setShowQuickAddDropdown(false);
  };

  const handleAddLine = () => {
    setLines([
      ...lines,
      { itemId: '', quantity: '1', unitCost: '0', discountRate: '0', updateSellingPrice: '' },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length === 1) {
      setLines([
        { itemId: '', quantity: '1', unitCost: '0', discountRate: '0', updateSellingPrice: '' },
      ]);
      return;
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof ReceiptLineForm, value: string) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };

    // Auto-populate latest averageCost when selecting an item for the first time
    if (field === 'itemId' && value) {
      const found = catalogItems.find((i) => i.id.toString() === value);
      if (found && (!newLines[index].unitCost || newLines[index].unitCost === '0')) {
        newLines[index].unitCost = Math.round(found.averageCost || 0).toString();
      }
    }
    setLines(newLines);
  };

  const handleCreateQuickSupplier = async () => {
    if (!quickSupplier.name.trim()) {
      setToast({ show: true, type: 'error', message: 'Vui lòng nhập tên Nhà cung cấp' });
      return;
    }
    setCreatingSupplier(true);
    const res = await dispatch(createSupplier(quickSupplier));
    setCreatingSupplier(false);
    if (res.meta.requestStatus === 'fulfilled') {
      const created = (res.payload as any)?.data;
      if (created?.id) {
        setFormData((prev) => ({ ...prev, supplierId: created.id.toString() }));
      }
      setQuickSupplier({ name: '', taxCode: '', contactPerson: '', phone: '' });
      setShowQuickSupplier(false);
      setToast({ show: true, type: 'success', message: 'Đã thêm Nhà cung cấp mới' });
    } else {
      setToast({ show: true, type: 'error', message: 'Không thể tạo Nhà cung cấp' });
    }
  };

  // Financial & MWA Simulation Summary
  const summary = useMemo(() => {
    let subtotal = 0;
    let discountAmount = 0;
    let marginWarningCount = 0;

    lines.forEach((line) => {
      const qty = Math.max(0, parseInt(line.quantity || '0', 10) || 0);
      const cost = Math.max(0, parseFloat(line.unitCost || '0') || 0);
      const disc = Math.min(100, Math.max(0, parseFloat(line.discountRate || '0') || 0));
      const gross = qty * cost;
      const lineDisc = gross * (disc / 100);
      subtotal += gross;
      discountAmount += lineDisc;

      const selectedItem = catalogItems.find((item) => item.id.toString() === line.itemId);
      if (selectedItem && qty > 0) {
        const netUnitCost = cost * (1 - disc / 100);
        const newOnHand = selectedItem.onHand + qty;
        const newAvgCost =
          newOnHand > 0
            ? (selectedItem.onHand * selectedItem.averageCost + qty * netUnitCost) / newOnHand
            : netUnitCost;
        const effectiveSelling = line.updateSellingPrice
          ? parseFloat(line.updateSellingPrice)
          : selectedItem.sellingPrice;
        if (newAvgCost >= effectiveSelling) {
          marginWarningCount++;
        }
      }
    });

    const netSubtotal = subtotal - discountAmount;
    const taxRateNum =
      formData.receiptType === 'OPENING_STOCK' ? 0 : parseFloat(formData.taxRate || '0') || 0;
    const taxAmount = Math.round(netSubtotal * (taxRateNum / 100));
    const grandTotal = Math.round(netSubtotal + taxAmount);

    return { subtotal, discountAmount, netSubtotal, taxRateNum, taxAmount, grandTotal, marginWarningCount };
  }, [lines, catalogItems, formData.taxRate, formData.receiptType]);

  const submitReceipt = async (status: 'DRAFT' | 'POSTED') => {
    if (formData.receiptType === 'PURCHASE' && !formData.supplierId) {
      setToast({
        show: true,
        type: 'error',
        message: 'Vui lòng chọn Nhà cung cấp đối với phiếu Nhập mua hàng',
      });
      return;
    }

    const validLines = lines.filter((l) => l.itemId);
    if (validLines.length === 0) {
      setToast({ show: true, type: 'error', message: 'Vui lòng chọn ít nhất 1 mặt hàng phụ tùng' });
      return;
    }

    for (let i = 0; i < validLines.length; i++) {
      const qty = parseFloat(validLines[i].quantity);
      const cost = parseFloat(validLines[i].unitCost);
      if (!validLines[i].itemId || qty <= 0 || !Number.isInteger(qty) || cost < 0) {
        setToast({
          show: true,
          type: 'error',
          message: `Dòng ${i + 1} không hợp lệ: Số lượng phải là số nguyên dương và đơn giá ≥ 0`,
        });
        return;
      }
    }

    const payload = {
      supplierId:
        formData.receiptType === 'OPENING_STOCK'
          ? null
          : formData.supplierId
          ? parseInt(formData.supplierId, 10)
          : null,
      receiptType: formData.receiptType,
      status,
      referenceNo: formData.referenceNo.trim(),
      receivedDate: new Date(formData.receivedDate).toISOString(),
      taxRate: formData.receiptType === 'OPENING_STOCK' ? 0 : parseFloat(formData.taxRate || '0'),
      notes: formData.notes.trim(),
      items: validLines.map((l) => ({
        itemId: parseInt(l.itemId, 10),
        quantity: parseInt(l.quantity, 10),
        unitCost: parseFloat(l.unitCost),
        discountRate: parseFloat(l.discountRate || '0'),
        updateSellingPrice: l.updateSellingPrice ? parseFloat(l.updateSellingPrice) : null,
      })),
    };

    const resultAction = await dispatch(createReceipt(payload));

    if (resultAction.meta.requestStatus === 'fulfilled') {
      setToast({
        show: true,
        type: 'success',
        message:
          status === 'DRAFT'
            ? 'Đã lưu bản nháp Phiếu nhập kho!'
            : 'Đã ghi sổ Nhập kho & cập nhật Giá vốn bình quân thành công!',
      });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 900);
    } else {
      setToast({
        show: true,
        type: 'error',
        message: (resultAction.payload as string) || actionError || 'Lỗi khi lưu phiếu nhập kho',
      });
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Lập Chứng Từ Nhập Kho Phụ Tùng"
        size="2xl"
      >
        <div className="space-y-3.5">
          {/* 1. Khối Tờ khai Chứng từ & Đối tác Cung ứng (Enterprise Split-Card Voucher Header) */}
          <div className="space-y-2.5">
            {/* 2 Khối Thẻ Tách Biệt: Đối tác Cung ứng (Trái) & Thông tin Chứng từ (Phải) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* Thẻ Trái: Đối tác Cung ứng / Nhà cung cấp */}
              <div className="lg:col-span-6 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#0866ff] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[15px]">domain</span>
                    </span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Đối tác cung ứng (Nhà cung cấp)
                      <span className="text-rose-600 ml-0.5">*</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQuickSupplier(!showQuickSupplier)}
                    className="h-6 px-2 rounded-lg bg-blue-50 hover:bg-blue-100/80 text-[#0866ff] text-[11px] font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {showQuickSupplier ? 'close' : 'add'}
                    </span>
                    <span>{showQuickSupplier ? 'Đóng tạo nhanh' : 'Thêm nhanh NCC'}</span>
                  </button>
                </div>

                <div className="relative">
                  <span className="material-symbols-outlined text-[17px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    storefront
                  </span>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full h-9 pl-9 pr-3 text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white focus:bg-white focus:border-[#0866ff] outline-none transition-colors"
                  >
                    <option value="">-- Chọn Nhà cung cấp phân phối phụ tùng --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code ? `[${s.code}] ` : ''}
                        {s.name} {s.taxCode ? `(MST: ${s.taxCode})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dải thông tin đối chiếu nhanh NCC đang chọn */}
                {(() => {
                  const selectedSup = suppliers.find(
                    (s) => s.id.toString() === formData.supplierId
                  );
                  if (!selectedSup) {
                    return (
                      <div className="px-3 py-1.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-[11px] text-amber-800 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-amber-600">
                          tips_and_updates
                        </span>
                        <span>
                          Chọn Nhà cung cấp để tự động đối chiếu Mã số thuế & lịch sử công nợ.
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div className="px-3 py-1.5 rounded-xl bg-blue-50/50 border border-blue-200/60 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-slate-700">
                      <span>
                        Mã: <strong className="text-[#0866ff]">{selectedSup.code}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        MST: <strong>{selectedSup.taxCode || 'Chưa cập nhật'}</strong>
                      </span>
                      {selectedSup.phone && (
                        <>
                          <span>·</span>
                          <span>
                            SĐT: <strong>{selectedSup.phone}</strong>
                          </span>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Thẻ Phải: Thông tin Chứng từ, Ngày hạch toán & Thuế suất VAT */}
              <div className="lg:col-span-6 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[15px]">receipt_long</span>
                    </span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Thông tin chứng từ & Thuế VAT
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500">VAT:</span>
                    <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200/80">
                      {(['0', '8', '10'] as const).map((rate) => {
                        const isActive = formData.taxRate === rate;
                        return (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => setFormData({ ...formData, taxRate: rate })}
                            className={`h-6 px-2 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-[#0866ff] text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {rate}%
                          </button>
                        );
                      })}
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={formData.taxRate}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setFormData({ ...formData, taxRate: '' });
                            return;
                          }
                          const num = Math.min(100, Math.max(0, parseFloat(val) || 0));
                          setFormData({ ...formData, taxRate: num.toString() });
                        }}
                        onBlur={() => {
                          if (formData.taxRate === '') {
                            setFormData({ ...formData, taxRate: '0' });
                          }
                        }}
                        title="Nhập mức thuế suất GTGT (%) tùy chỉnh (0 - 100%)"
                        className="w-14 h-7 pl-2 pr-5 text-right text-xs font-mono font-bold text-[#0866ff] rounded-lg border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#0866ff] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-1.5 text-[11px] font-mono font-bold text-slate-400 pointer-events-none">
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="relative">
                    <span className="material-symbols-outlined text-[16px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      description
                    </span>
                    <input
                      type="text"
                      value={formData.referenceNo}
                      onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                      placeholder="Số HĐ VAT / Chứng từ (VD: HD-00125)"
                      className="w-full h-9 pl-9 pr-3 text-xs font-mono text-slate-800 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white focus:bg-white focus:border-[#0866ff] outline-none transition-colors"
                    />
                  </div>

                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined text-[16px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      event
                    </span>
                    <input
                      type="date"
                      value={formData.receivedDate}
                      onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                      className="w-full h-9 pl-9 pr-2.5 text-xs font-mono font-semibold text-slate-800 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white focus:bg-white focus:border-[#0866ff] outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="relative">
                  <span className="material-symbols-outlined text-[16px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    edit_note
                  </span>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Ghi chú diễn giải (Hợp đồng nguyên tắc, người giao hàng, biển số xe tải...)"
                    className="w-full h-8 pl-9 pr-3 text-xs text-slate-700 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white focus:bg-white focus:border-[#0866ff] outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Khung tạo nhanh Nhà cung cấp (Trượt mở khi bấm + Thêm nhanh NCC) */}
            {showQuickSupplier && (
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0050cd] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">domain_add</span>
                    Khởi tạo nhanh Nhà cung cấp mới
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Tên công ty / Nhà cung cấp *"
                    value={quickSupplier.name}
                    onChange={(e) => setQuickSupplier({ ...quickSupplier, name: e.target.value })}
                    className="h-8 px-2.5 text-xs rounded-lg border border-slate-200 bg-white sm:col-span-2 outline-none focus:border-[#0866ff]"
                  />
                  <input
                    type="text"
                    placeholder="Mã số thuế (VD: 0301234567)"
                    value={quickSupplier.taxCode}
                    onChange={(e) =>
                      setQuickSupplier({ ...quickSupplier, taxCode: e.target.value })
                    }
                    className="h-8 px-2.5 text-xs font-mono rounded-lg border border-slate-200 bg-white outline-none focus:border-[#0866ff]"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="SĐT liên hệ"
                      value={quickSupplier.phone}
                      onChange={(e) =>
                        setQuickSupplier({ ...quickSupplier, phone: e.target.value })
                      }
                      className="h-8 px-2.5 text-xs font-mono rounded-lg border border-slate-200 bg-white flex-1 min-w-0 outline-none focus:border-[#0866ff]"
                    />
                    <button
                      type="button"
                      disabled={creatingSupplier}
                      onClick={handleCreateQuickSupplier}
                      className="h-8 px-3 rounded-lg bg-[#0866ff] hover:bg-[#0050cd] text-white text-xs font-bold shrink-0 cursor-pointer"
                    >
                      {creatingSupplier ? '...' : 'Lưu NCC'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Thanh tìm kiếm nhanh phụ tùng & Gợi ý nhập bù hàng chạm định mức */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="relative flex-1 max-w-md">
              <div className="flex items-center gap-2 h-9 px-3 rounded-xl bg-white border border-slate-200 focus-within:border-[#0866ff] shadow-2xs">
                <span className="material-symbols-outlined text-[18px] text-[#0866ff]">
                  search
                </span>
                <input
                  type="text"
                  value={skuSearch}
                  onFocus={() => setShowQuickAddDropdown(true)}
                  onBlur={() => setTimeout(() => setShowQuickAddDropdown(false), 180)}
                  onChange={(e) => {
                    setSkuSearch(e.target.value);
                    setShowQuickAddDropdown(true);
                  }}
                  placeholder="Gõ tìm nhanh phụ tùng, thương hiệu để thêm vào phiếu..."
                  className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-none"
                />
              </div>
              {showQuickAddDropdown && quickSearchMatchedItems.length > 0 && (
                <div className="absolute left-0 right-0 top-10 z-30 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {quickSearchMatchedItems.map((item) => {
                    const isLow = item.onHand <= item.reorderLevel;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onMouseDown={() => handleQuickSelectSku(item)}
                        className="w-full px-3.5 py-2.5 text-left hover:bg-blue-50/60 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {item.partCategory?.name || item.name}
                            {item.brand ? ` · ${item.brand.name}` : ''}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Giá vốn TB: {item.averageCost.toLocaleString('vi-VN')} ₫ · Giá bán:{' '}
                            {item.sellingPrice.toLocaleString('vi-VN')} ₫
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                            isLow
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          Tồn: {item.onHand} {item.uom?.name || ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAutoFillLowStock}
                className="h-9 px-3.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-200/90 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Tự động lọc và điền các phụ tùng đang chạm hoặc dưới mức tồn kho an toàn"
              >
                <span className="material-symbols-outlined text-[17px] text-amber-600">
                  bolt
                </span>
                <span>
                  Điền nhanh hàng dưới định mức ({lowStockCatalog.length})
                </span>
              </button>

              <button
                type="button"
                onClick={handleAddLine}
                className="h-9 px-3.5 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-[#0866ff] border border-blue-200/80 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">add_circle</span>
                <span>Thêm dòng</span>
              </button>
            </div>
          </div>

          {/* 3. Bảng Chi tiết Vật tư & Mô phỏng Giá vốn Bình quân Gia quyền (CT-INV01) */}
          <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white">
            <div className="overflow-x-auto max-h-[250px]">
              <table className="w-full text-left border-collapse min-w-[920px]">
                <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 text-[11px] font-bold uppercase text-slate-600 tracking-wider whitespace-nowrap">
                  <tr>
                    <th className="py-2.5 px-2.5 w-9 text-center">#</th>
                    <th className="py-2.5 px-3 w-[35%] min-w-[300px]">Phụ tùng</th>
                    <th className="py-2.5 px-2.5 w-24 text-center">SL Nhập</th>
                    <th className="py-2.5 px-3 w-36 text-right">Đơn giá mua (₫)</th>
                    <th className="py-2.5 px-2.5 w-20 text-center">% CK</th>
                    <th className="py-2.5 px-3 w-52">Giá vốn TB dự kiến</th>
                    <th className="py-2.5 px-3 w-36 text-right">Thành tiền (₫)</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {lines.map((line, index) => {
                    const selectedItem = catalogItems.find(
                      (item) => item.id.toString() === line.itemId
                    );
                    const qty = Math.max(0, parseInt(line.quantity || '0', 10) || 0);
                    const unitCost = Math.max(0, parseFloat(line.unitCost || '0') || 0);
                    const discountRate = Math.min(
                      100,
                      Math.max(0, parseFloat(line.discountRate || '0') || 0)
                    );
                    const netUnitCost = unitCost * (1 - discountRate / 100);
                    const lineTotal = Math.round(qty * netUnitCost);

                    // Moving Weighted Average (CT-INV01) preview
                    const oldOnHand = selectedItem?.onHand ?? 0;
                    const oldAvgCost = selectedItem?.averageCost ?? 0;
                    const newOnHand = oldOnHand + qty;
                    const newAvgCost =
                      selectedItem && newOnHand > 0
                        ? Math.round((oldOnHand * oldAvgCost + qty * netUnitCost) / newOnHand)
                        : Math.round(netUnitCost);

                    const effectiveSellingPrice = line.updateSellingPrice
                      ? parseFloat(line.updateSellingPrice)
                      : selectedItem?.sellingPrice ?? 0;

                    const isNegativeMargin =
                      Boolean(selectedItem) && qty > 0 && newAvgCost >= effectiveSellingPrice;
                    const costDeltaPct =
                      selectedItem && oldAvgCost > 0
                        ? Math.round(((newAvgCost - oldAvgCost) / oldAvgCost) * 100)
                        : 0;

                    return (
                      <tr
                        key={index}
                        className={
                          isNegativeMargin
                            ? 'bg-rose-50/50 hover:bg-rose-50/80'
                            : 'hover:bg-slate-50/70'
                        }
                      >
                        <td className="py-2 px-2.5 text-center font-mono text-slate-400 font-semibold">
                          {index + 1}
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={line.itemId}
                            onChange={(e) => handleLineChange(index, 'itemId', e.target.value)}
                            className="w-full h-8 px-2.5 text-xs font-semibold text-slate-800 rounded-lg border border-slate-200 bg-white focus:border-[#0866ff] outline-none truncate"
                            required
                          >
                            <option value="">-- Chọn phụ tùng --</option>
                            {catalogItems.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.partCategory?.name || item.name}
                                {item.brand ? ` · ${item.brand.name}` : ''}
                              </option>
                            ))}
                          </select>
                          {selectedItem && (
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                              <span>
                                ĐVT: <strong className="text-slate-700">{selectedItem.uom?.name}</strong>
                              </span>
                              <span>·</span>
                              <span>
                                Tồn hiện tại: <strong className="text-slate-700">{oldOnHand}</strong>
                              </span>
                              <span>·</span>
                              <span>
                                Giá bán:{' '}
                                <strong className="text-slate-800">
                                  {effectiveSellingPrice.toLocaleString('vi-VN')} ₫
                                </strong>
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="py-2 px-2.5">
                          <input
                            type="number"
                            value={line.quantity}
                            onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                            min="1"
                            step="1"
                            className="w-full h-8 px-2 text-center font-mono font-bold text-slate-900 rounded-lg border border-slate-200 bg-white focus:border-[#0866ff] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            required
                          />
                        </td>

                        <td className="py-2 px-3">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={
                              line.unitCost !== ''
                                ? (parseInt(line.unitCost, 10) || 0).toLocaleString('vi-VN')
                                : ''
                            }
                            onChange={(e) => {
                              const rawDigits = e.target.value.replace(/\D/g, '');
                              handleLineChange(index, 'unitCost', rawDigits || '0');
                            }}
                            className="w-full h-8 px-2.5 text-right font-mono font-semibold text-slate-900 rounded-lg border border-slate-200 bg-white focus:border-[#0866ff] outline-none"
                            required
                          />
                        </td>

                        <td className="py-2 px-2.5">
                          <input
                            type="number"
                            value={line.discountRate}
                            onChange={(e) =>
                              handleLineChange(index, 'discountRate', e.target.value)
                            }
                            min="0"
                            max="100"
                            className="w-full h-8 px-2 text-center font-mono text-slate-700 rounded-lg border border-slate-200 bg-white focus:border-[#0866ff] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>

                        <td className="py-2 px-3">
                          {selectedItem ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-[11px] font-mono whitespace-nowrap">
                                <span className="text-slate-500">
                                  {oldAvgCost.toLocaleString('vi-VN')} ₫
                                </span>
                                <span className="text-slate-400">→</span>
                                <span
                                  className={`font-bold ${
                                    isNegativeMargin ? 'text-rose-600' : 'text-[#0050cd]'
                                  }`}
                                >
                                  {newAvgCost.toLocaleString('vi-VN')} ₫
                                </span>
                                {costDeltaPct !== 0 && (
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                      costDeltaPct > 0
                                        ? 'bg-amber-50 text-amber-700'
                                        : 'bg-emerald-50 text-emerald-700'
                                    }`}
                                  >
                                    {costDeltaPct > 0 ? `+${costDeltaPct}%` : `${costDeltaPct}%`}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                Tồn kho: {oldOnHand} →{' '}
                                <strong className="text-emerald-700">{newOnHand}</strong>{' '}
                                {selectedItem.uom?.name}
                              </div>
                              {isNegativeMargin && (
                                <div className="pt-0.5 flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-rose-600 flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-[13px]">
                                      warning
                                    </span>
                                    Giá vốn ≥ Giá bán!
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleLineChange(
                                        index,
                                        'updateSellingPrice',
                                        (Math.ceil((newAvgCost * 1.25) / 1000) * 1000).toString()
                                      )
                                    }
                                    className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700 cursor-pointer"
                                  >
                                    Nâng giá (+25%)
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Chọn phụ tùng để tính</span>
                          )}
                        </td>

                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {lineTotal.toLocaleString('vi-VN')} ₫
                        </td>

                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(index)}
                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                            title="Xóa dòng"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 4. Tổng hợp Tài chính Chứng từ */}
            <div className="bg-slate-50/95 px-4 py-3 border-t border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#0866ff]">
                    info
                  </span>
                  <span>
                    Giá vốn bình quân gia quyền được tính tự động theo công thức{' '}
                    <strong className="font-mono text-slate-800">CT-INV01</strong> khi bấm Ghi sổ.
                  </span>
                </div>
                {summary.marginWarningCount > 0 && (
                  <div className="text-rose-600 font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    <span>
                      Cảnh báo: Có {summary.marginWarningCount} mặt hàng có Giá vốn bình quân mới ≥
                      Giá bán hiện tại!
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-5 text-xs shrink-0">
                <div>
                  <span className="text-slate-500 block">Tiền hàng trước thuế</span>
                  <span className="font-mono font-bold text-slate-800">
                    {Math.round(summary.subtotal).toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                {summary.discountAmount > 0 && (
                  <div>
                    <span className="text-slate-500 block">Chiết khấu</span>
                    <span className="font-mono font-bold text-emerald-700">
                      -{Math.round(summary.discountAmount).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block">Thuế VAT ({summary.taxRateNum}%)</span>
                  <span className="font-mono font-bold text-slate-800">
                    +{summary.taxAmount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="pl-4 border-l border-slate-200">
                  <span className="text-slate-500 block font-semibold">Tổng giá trị phiếu</span>
                  <span className="text-base font-mono font-extrabold text-[#0866ff]">
                    {summary.grandTotal.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Action Buttons: Đóng | Lưu Nháp (DRAFT) | Xác nhận & Ghi sổ (POSTED) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <span className="text-xs text-slate-500">
              Bạn có thể <strong>Lưu bản nháp</strong> để kiểm đếm hàng thực tế trước khi chính thức{' '}
              <strong>Ghi sổ nhập kho</strong>.
            </span>

            <div className="flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => submitReceipt('DRAFT')}
                className="h-9 px-4 flex items-center gap-1.5 bg-white hover:bg-amber-50/70 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">edit_document</span>
                <span>Lưu bản nháp (DRAFT)</span>
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => submitReceipt('POSTED')}
                className="h-9 px-5 flex items-center gap-2 bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-md shadow-[#0866ff]/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">verified</span>
                <span>{actionLoading ? 'Đang xử lý...' : 'Xác nhận & Ghi sổ Nhập kho'}</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </>
  );
}
