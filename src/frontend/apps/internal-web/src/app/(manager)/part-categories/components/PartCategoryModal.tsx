'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  createPartCategory,
  updatePartCategory,
  clearActionError,
  PartCategory,
  ItemType,
  Uom,
} from '@/store/slices/inventorySlice';
import Modal from '@/components/shared/Modal';
import Toast from '@/components/shared/Toast';

function generateCodeFromName(name: string): string {
  if (!name) return '';
  const noAccents = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
  return noAccents.toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}


interface PartCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: PartCategory | null; // if null, mode is CREATE
  onSuccess: () => void;
  uomOptions: Uom[];
}

const inputClass =
  'w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none';

export function PartCategoryModal({ isOpen, onClose, category, onSuccess, uomOptions }: PartCategoryModalProps) {
  const dispatch = useAppDispatch();
  const { actionLoading, actionError } = useAppSelector((state) => state.inventory);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    itemType: 'PART' as ItemType,
    uomId: '',
    description: '',
  });
  const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({
    show: false,
    type: 'success',
    message: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setFormData({
          code: category.code,
          name: category.name,
          itemType: category.itemType,
          uomId: category.uomId.toString(),
          description: category.description || '',
        });
      } else {
        setFormData({ code: '', name: '', itemType: 'PART', uomId: uomOptions[0]?.id?.toString() || '', description: '' });
      }
      dispatch(clearActionError());
    }
  }, [isOpen, category, uomOptions, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      code: formData.code,
      name: formData.name,
      itemType: formData.itemType,
      uomId: parseInt(formData.uomId),
      description: formData.description,
    };

    const resultAction = category
      ? await dispatch(updatePartCategory({ id: category.id, data }))
      : await dispatch(createPartCategory(data));

    if (resultAction.meta.requestStatus === 'fulfilled') {
      setToast({ show: true, type: 'success', message: category ? 'Cập nhật danh mục thành công' : 'Thêm danh mục thành công' });
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
      <Modal isOpen={isOpen} onClose={onClose} title={category ? 'Cập nhật Danh mục phụ tùng' : 'Thêm Danh mục phụ tùng'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-label-sm text-on-surface font-medium mb-1">
                Mã danh mục <span className="text-error">*</span>
              </label>
              <input
                id="part-category-code"
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className={inputClass}
                placeholder="VD: LOC-GIO"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-label-sm text-on-surface font-medium mb-1">
                Tên danh mục <span className="text-error">*</span>
              </label>
              <input
                id="part-category-name"
                type="text"
                value={formData.name}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!category) {
                    setFormData({ ...formData, name: val, code: generateCodeFromName(val) });
                  } else {
                    setFormData({ ...formData, name: val });
                  }
                }}
                className={inputClass}
                placeholder="VD: Lọc gió động cơ"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-sm text-on-surface font-medium mb-1">
                Loại vật tư <span className="text-error">*</span>
              </label>
              <select
                id="part-category-type"
                value={formData.itemType}
                onChange={(e) => setFormData({ ...formData, itemType: e.target.value as ItemType })}
                className={inputClass}
                required
              >
                <option value="PART">Phụ tùng thay thế</option>
                <option value="CONSUMABLE">Vật tư tiêu hao</option>
                <option value="CHEMICAL">Hóa chất</option>
                <option value="ACCESSORY">Phụ kiện</option>
              </select>
            </div>
            <div>
              <label className="block text-label-sm text-on-surface font-medium mb-1">
                Đơn vị tính <span className="text-error">*</span>
              </label>
              <select
                id="part-category-uom"
                value={formData.uomId}
                onChange={(e) => setFormData({ ...formData, uomId: e.target.value })}
                className={inputClass}
                required
              >
                <option value="">-- Chọn ĐVT --</option>
                {uomOptions.map((uom) => (
                  <option key={uom.id} value={uom.id}>
                    {uom.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-label-sm text-on-surface font-medium mb-1">Mô tả</label>
            <textarea
              id="part-category-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
            />
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
