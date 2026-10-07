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

const ITEM_TYPE_LABELS: Record<string, string> = {
  PART: 'Phụ tùng thay thế',
  CONSUMABLE: 'Vật tư tiêu hao',
  CHEMICAL: 'Hóa chất',
  ACCESSORY: 'Phụ kiện',
};

const inputClass =
  'w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none';

export function PartItemModal({ isOpen, onClose, item, onSuccess, categoryOptions, brandOptions }: PartItemModalProps) {
  const dispatch = useAppDispatch();
  const { actionLoading, actionError } = useAppSelector((state) => state.inventory);

  const [formData, setFormData] = useState({
    sku: '',
    partCategoryId: '',
    brandId: '',
    sellingPrice: '',
    reorderLevel: '0',
  });

  const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({
    show: false,
    type: 'success',
    message: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData({
          sku: item.sku,
          partCategoryId: item.partCategoryId.toString(),
          brandId: item.brandId?.toString() || '',
          sellingPrice: item.sellingPrice.toString(),
          reorderLevel: item.reorderLevel.toString(),
        });
      } else {
        setFormData({ sku: '', partCategoryId: '', brandId: '', sellingPrice: '', reorderLevel: '0' });
      }
      dispatch(clearActionError());
    }
  }, [isOpen, item, dispatch]);

  useEffect(() => {
    if (isOpen && !item) {
      const cat = categoryOptions.find(c => c.id.toString() === formData.partCategoryId);
      const br = brandOptions.find(b => b.id.toString() === formData.brandId);
      
      if (cat) {
        let newSku = cat.code;
        if (br) {
          const brandSlug = br.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
          newSku = `${newSku}-${brandSlug}`;
        }
        setFormData(prev => ({ ...prev, sku: newSku }));
      } else {
        setFormData(prev => ({ ...prev, sku: '' }));
      }
    }
  }, [formData.partCategoryId, formData.brandId, isOpen, item, categoryOptions, brandOptions]);

  const selectedCategory = useMemo(
    () => categoryOptions.find((c) => c.id.toString() === formData.partCategoryId),
    [categoryOptions, formData.partCategoryId],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      sku: formData.sku,
      partCategoryId: parseInt(formData.partCategoryId),
      brandId: formData.brandId ? parseInt(formData.brandId) : null,
      sellingPrice: parseFloat(formData.sellingPrice),
      reorderLevel: parseInt(formData.reorderLevel || '0'),
    };

    const resultAction = item
      ? await dispatch(updateInventoryItem({ id: item.id, data }))
      : await dispatch(createInventoryItem(data));

    if (resultAction.meta.requestStatus === 'fulfilled') {
      setToast({ show: true, type: 'success', message: item ? 'Cập nhật phụ tùng thành công' : 'Thêm phụ tùng thành công' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } else {
      setToast({ show: true, type: 'error', message: (resultAction.payload as string) || 'Có lỗi xảy ra' });
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Cập nhật Phụ tùng' : 'Thêm Phụ tùng theo hãng'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-label-sm text-on-surface font-medium mb-1">
              Danh mục phụ tùng <span className="text-error">*</span>
            </label>
            <select
              id="part-item-category"
              value={formData.partCategoryId}
              onChange={(e) => setFormData({ ...formData, partCategoryId: e.target.value })}
              className={inputClass}
              required
            >
              <option value="">-- Chọn danh mục --</option>
              {categoryOptions
                .filter((c) => c.isActive || c.id.toString() === formData.partCategoryId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
            </select>
            {selectedCategory && (
              <p className="mt-1 text-body-sm text-outline">
                {ITEM_TYPE_LABELS[selectedCategory.itemType] || selectedCategory.itemType} · ĐVT: {selectedCategory.uom?.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-sm text-on-surface font-medium mb-1">
                Mã SKU <span className="text-error">*</span>
              </label>
              <input
                id="part-item-sku"
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className={inputClass}
                placeholder="VD: LOC-GIO-DENSO-001"
                required
                disabled={!!item}
              />
            </div>
            <div>
              <label className="block text-label-sm text-on-surface font-medium mb-1">Thương hiệu</label>
              <select
                id="part-item-brand"
                value={formData.brandId}
                onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                className={inputClass}
              >
                <option value="">-- Không xác định --</option>
                {brandOptions.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-sm text-on-surface font-medium mb-1">
                Giá bán dự kiến <span className="text-error">*</span>
              </label>
              <input
                id="part-item-price"
                type="number"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                className={inputClass}
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-label-sm text-on-surface font-medium mb-1">Mức cảnh báo tồn thấp</label>
              <input
                id="part-item-reorder"
                type="number"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                className={inputClass}
                min="0"
                step="1"
              />
            </div>
          </div>

          {actionError && (
            <div className="p-3 bg-error-container text-error rounded-lg text-body-sm font-medium">{actionError}</div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-on-surface-variant font-medium hover:bg-surface-container-low rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-primary-container hover:bg-primary text-on-primary font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Đang xử lý...' : 'Lưu lại'}
            </button>
          </div>
        </form>
      </Modal>

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </>
  );
}
