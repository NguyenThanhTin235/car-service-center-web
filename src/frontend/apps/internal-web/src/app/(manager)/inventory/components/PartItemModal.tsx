'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  createInventoryItem,
  updateInventoryItem,
  clearActionError,
  InventoryItem,
  PartCategory,
  Brand,
} from '@/store/slices/inventorySlice';
import Modal from '@/components/shared/Modal';
import Toast from '@/components/shared/Toast';

interface PartItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: InventoryItem | null; // if null, mode is CREATE
  onSuccess: () => void;
  categoryOptions: PartCategory[];
  brandOptions: Brand[];
}

const ITEM_TYPE_META: Record<string, { label: string; badgeClass: string }> = {
  PART: {
    label: 'Phụ tùng thay thế',
    badgeClass: 'bg-blue-50 text-[#0050cd] border-blue-200/80',
  },
  CONSUMABLE: {
    label: 'Vật tư tiêu hao',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
  },
  CHEMICAL: {
    label: 'Hóa chất bảo dưỡng',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
  },
  ACCESSORY: {
    label: 'Phụ kiện nâng cấp',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200/80',
  },
};

export function PartItemModal({
  isOpen,
  onClose,
  item,
  onSuccess,
  categoryOptions,
  brandOptions,
}: PartItemModalProps) {
  const dispatch = useAppDispatch();
  const { actionLoading, actionError } = useAppSelector((state) => state.inventory);

  const [formData, setFormData] = useState({
    partCategoryId: '',
    brandId: '',
    sellingPrice: '',
    reorderLevel: '5',
  });

  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({
    show: false,
    type: 'success',
    message: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData({
          partCategoryId: item.partCategoryId.toString(),
          brandId: item.brandId?.toString() || '',
          sellingPrice: Math.round(item.sellingPrice || 0).toString(),
          reorderLevel: (item.reorderLevel ?? 0).toString(),
        });
      } else {
        setFormData({
          partCategoryId: '',
          brandId: '',
          sellingPrice: '',
          reorderLevel: '5',
        });
      }
      dispatch(clearActionError());
    }
  }, [isOpen, item, dispatch]);

  const selectedCategory = useMemo(
    () => categoryOptions.find((c) => c.id.toString() === formData.partCategoryId),
    [categoryOptions, formData.partCategoryId]
  );

  const handleStepReorder = (delta: number) => {
    const current = parseInt(formData.reorderLevel || '0', 10) || 0;
    const next = Math.max(0, current + delta);
    setFormData((prev) => ({ ...prev, reorderLevel: next.toString() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partCategoryId) {
      setToast({ show: true, type: 'error', message: 'Vui lòng chọn Danh mục phụ tùng' });
      return;
    }

    const sellingPriceNum = parseFloat(formData.sellingPrice || '0');
    if (isNaN(sellingPriceNum) || sellingPriceNum <= 0) {
      setToast({ show: true, type: 'error', message: 'Vui lòng nhập Giá bán dự kiến hợp lệ (> 0)' });
      return;
    }

    const data = {
      partCategoryId: parseInt(formData.partCategoryId, 10),
      brandId: formData.brandId ? parseInt(formData.brandId, 10) : null,
      sellingPrice: sellingPriceNum,
      reorderLevel: Math.max(0, parseInt(formData.reorderLevel || '0', 10) || 0),
    };

    const resultAction = item
      ? await dispatch(updateInventoryItem({ id: item.id, data }))
      : await dispatch(createInventoryItem(data));

    if (resultAction.meta.requestStatus === 'fulfilled') {
      setToast({
        show: true,
        type: 'success',
        message: item ? 'Cập nhật phụ tùng thành công!' : 'Đã thêm phụ tùng mới vào danh mục kho!',
      });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 900);
    } else {
      setToast({
        show: true,
        type: 'error',
        message: (resultAction.payload as string) || 'Không thể lưu thông tin phụ tùng',
      });
    }
  };

  const typeMeta = selectedCategory
    ? ITEM_TYPE_META[selectedCategory.itemType] || {
        label: selectedCategory.itemType,
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      }
    : null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={item ? 'Cập nhật Phụ tùng theo hãng' : 'Thêm Phụ tùng theo hãng'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Khối 1: Định danh Danh mục & Thương hiệu */}
          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#0866ff] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[15px]">inventory_2</span>
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Thông tin Danh mục & Thương hiệu
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200/80 text-[11px] font-mono font-semibold text-slate-600">
                {item ? `Mã: ${item.sku}` : 'Mã tự động cấp'}
              </span>
            </div>

            {/* Danh mục phụ tùng */}
            <div>
              <label
                htmlFor="part-item-category"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Danh mục phụ tùng <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined text-[17px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  category
                </span>
                <select
                  id="part-item-category"
                  value={formData.partCategoryId}
                  onChange={(e) => setFormData({ ...formData, partCategoryId: e.target.value })}
                  className="w-full h-10 pl-9 pr-3 text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 bg-white focus:border-[#0866ff] outline-none transition-colors"
                  required
                >
                  <option value="">-- Chọn danh mục vật tư / phụ tùng gốc --</option>
                  {categoryOptions
                    .filter((c) => c.isActive || c.id.toString() === formData.partCategoryId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        [{c.code}] {c.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Dải hiển thị thông tin Danh mục khi đã chọn */}
              {selectedCategory && typeMeta && (
                <div className="mt-2 px-3 py-2 rounded-xl bg-white border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${typeMeta.badgeClass}`}
                    >
                      {typeMeta.label}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600 font-mono text-[11px]">
                      Mã nhóm: <strong className="text-slate-800">{selectedCategory.code}</strong>
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-bold">
                    ĐVT: {selectedCategory.uom?.name || 'Cái'}
                  </span>
                </div>
              )}
            </div>

            {/* Thương hiệu / Hãng sản xuất */}
            <div>
              <label
                htmlFor="part-item-brand"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Thương hiệu / Hãng sản xuất
              </label>
              <div className="relative">
                <span className="material-symbols-outlined text-[17px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  verified
                </span>
                <select
                  id="part-item-brand"
                  value={formData.brandId}
                  onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                  className="w-full h-10 pl-9 pr-3 text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 bg-white focus:border-[#0866ff] outline-none transition-colors"
                >
                  <option value="">-- Không xác định / Hàng tiêu chuẩn --</option>
                  {brandOptions.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phím chọn nhanh Thương hiệu phổ biến */}
              {brandOptions.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 mr-0.5">Chọn nhanh:</span>
                  {brandOptions.slice(0, 6).map((b) => {
                    const isSelected = formData.brandId === b.id.toString();
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            brandId: isSelected ? '' : b.id.toString(),
                          }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-[#0866ff] text-white border-[#0866ff] shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                        }`}
                      >
                        {b.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Khối 2: Chính sách Giá bán & Mức cảnh báo tồn kho */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[15px]">payments</span>
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Giá bán niêm yết & Định mức tồn kho
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Giá bán dự kiến */}
              <div>
                <label
                  htmlFor="part-item-price"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Giá bán dự kiến <span className="text-rose-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    id="part-item-price"
                    type="text"
                    inputMode="numeric"
                    value={
                      formData.sellingPrice !== ''
                        ? (parseInt(formData.sellingPrice, 10) || 0).toLocaleString('vi-VN')
                        : ''
                    }
                    onChange={(e) => {
                      const rawDigits = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, sellingPrice: rawDigits });
                    }}
                    placeholder="VD: 250.000"
                    className="w-full h-10 pl-3.5 pr-12 text-sm font-mono font-bold text-slate-900 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#0866ff] outline-none transition-colors"
                    required
                  />
                  <span className="absolute right-3 px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-mono font-bold text-slate-500 pointer-events-none">
                    ₫
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Đơn giá niêm yết xuất báo giá sửa chữa cho khách hàng.
                </p>
              </div>

              {/* Mức cảnh báo tồn thấp */}
              <div>
                <label
                  htmlFor="part-item-reorder"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Mức cảnh báo tồn thấp
                </label>
                <div className="flex items-center h-10 rounded-xl border border-slate-200 bg-slate-50/50 focus-within:bg-white focus-within:border-[#0866ff] overflow-hidden transition-colors">
                  <button
                    type="button"
                    onClick={() => handleStepReorder(-1)}
                    className="w-10 h-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer border-r border-slate-200/80"
                  >
                    <span className="material-symbols-outlined text-[16px]">remove</span>
                  </button>
                  <input
                    id="part-item-reorder"
                    type="number"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    min="0"
                    step="1"
                    className="flex-1 h-full px-2 text-center text-sm font-mono font-bold text-slate-900 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="px-2 text-[11px] font-mono text-slate-400">
                    {selectedCategory?.uom?.name || 'ĐVT'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStepReorder(1)}
                    className="w-10 h-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer border-l border-slate-200/80"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Cảnh báo nhập bù khi tồn thực tế chạm hoặc dưới ngưỡng này.
                </p>
              </div>
            </div>
          </div>

          {actionError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{actionError}</span>
            </div>
          )}

          {/* Thanh tác vụ dưới đáy */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-[#0866ff]">
                auto_awesome
              </span>
              Hệ thống tự động sinh mã định danh phụ tùng theo danh mục.
            </span>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="h-9 px-5 flex items-center gap-1.5 bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:brightness-110 text-white text-xs font-bold rounded-xl shadow-md shadow-[#0866ff]/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>{actionLoading ? 'Đang xử lý...' : item ? 'Cập nhật' : 'Lưu phụ tùng'}</span>
              </button>
            </div>
          </div>
        </form>
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
