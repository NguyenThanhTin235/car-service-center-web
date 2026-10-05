'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { createInventoryItem, updateInventoryItem, clearActionError, InventoryItem } from '@/store/slices/inventorySlice';
import Modal from '@/components/shared/Modal';
import Toast from '@/components/shared/Toast';

interface PartItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: InventoryItem | null; // if null, mode is CREATE
  onSuccess: () => void;
  uomOptions: { id: number; name: string }[];
}

export function PartItemModal({ isOpen, onClose, item, onSuccess, uomOptions }: PartItemModalProps) {
  const dispatch = useAppDispatch();
  const { actionLoading, actionError } = useAppSelector((state) => state.inventory);
  
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    itemType: 'PART',
    uomId: '',
    sellingPrice: '',
    reorderLevel: '0'
  });
  
  const [toast, setToast] = useState<{show: boolean, type: 'success' | 'error', message: string}>({ show: false, type: 'success', message: '' });

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData({
          sku: item.sku,
          name: item.name,
          itemType: item.itemType,
          uomId: item.uomId.toString(),
          sellingPrice: item.sellingPrice.toString(),
          reorderLevel: item.reorderLevel.toString()
        });
      } else {
        setFormData({
          sku: '',
          name: '',
          itemType: 'PART',
          uomId: uomOptions[0]?.id?.toString() || '',
          sellingPrice: '',
          reorderLevel: '0'
        });
      }
      dispatch(clearActionError());
    }
  }, [isOpen, item, uomOptions, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      sku: formData.sku,
      name: formData.name,
      itemType: formData.itemType as any,
      uomId: parseInt(formData.uomId),
      sellingPrice: parseFloat(formData.sellingPrice),
      reorderLevel: parseFloat(formData.reorderLevel || '0')
    };

    let resultAction;
    if (item) {
      resultAction = await dispatch(updateInventoryItem({ id: item.id, data }));
    } else {
      resultAction = await dispatch(createInventoryItem(data));
    }

    if (resultAction.meta.requestStatus === 'fulfilled') {
      setToast({ show: true, type: 'success', message: item ? 'Cập nhật phụ tùng thành công' : 'Thêm phụ tùng thành công' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } else {
      setToast({ show: true, type: 'error', message: actionError || 'Có lỗi xảy ra' });
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Cập nhật Phụ tùng' : 'Thêm Phụ tùng mới'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-label-sm text-on-surface font-medium mb-1">Mã SKU <span className="text-error">*</span></label>
            <input 
              type="text" 
              value={formData.sku}
              onChange={(e) => setFormData({...formData, sku: e.target.value})}
              className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
              required 
              disabled={!!item}
            />
          </div>
          <div>
            <label className="block text-label-sm text-on-surface font-medium mb-1">Tên phụ tùng <span className="text-error">*</span></label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
              required 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-sm text-on-surface font-medium mb-1">Loại vật tư <span className="text-error">*</span></label>
              <select 
                value={formData.itemType}
                onChange={(e) => setFormData({...formData, itemType: e.target.value})}
                className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
                required
              >
                <option value="PART">Phụ tùng thay thế</option>
                <option value="CONSUMABLE">Vật tư tiêu hao</option>
                <option value="CHEMICAL">Hóa chất</option>
                <option value="ACCESSORY">Phụ kiện</option>
              </select>
            </div>
            <div>
              <label className="block text-label-sm text-on-surface font-medium mb-1">Đơn vị tính <span className="text-error">*</span></label>
              <select 
                value={formData.uomId}
                onChange={(e) => setFormData({...formData, uomId: e.target.value})}
                className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
                required
              >
                <option value="">-- Chọn ĐVT --</option>
                {uomOptions.map(uom => (
                  <option key={uom.id} value={uom.id}>{uom.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-sm text-on-surface font-medium mb-1">Giá bán dự kiến <span className="text-error">*</span></label>
              <input 
                type="number" 
                value={formData.sellingPrice}
                onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})}
                className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
                min="0"
                required 
              />
            </div>
            <div>
              <label className="block text-label-sm text-on-surface font-medium mb-1">Mức cảnh báo tồn thấp</label>
              <input 
                type="number" 
                value={formData.reorderLevel}
                onChange={(e) => setFormData({...formData, reorderLevel: e.target.value})}
                className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
                min="0"
              />
            </div>
          </div>

          {actionError && (
            <div className="p-3 bg-error-container text-error rounded-lg text-body-sm font-medium">
              {actionError}
            </div>
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

      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({...toast, show: false})} 
        />
      )}
    </>
  );
}
