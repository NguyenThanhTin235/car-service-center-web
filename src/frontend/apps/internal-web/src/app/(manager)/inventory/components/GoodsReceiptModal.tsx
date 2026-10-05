'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { createReceipt, fetchSuppliers, InventoryItem } from '@/store/slices/inventorySlice';
import Modal from '@/components/shared/Modal';
import Toast from '@/components/shared/Toast';

interface GoodsReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  inventoryItems: InventoryItem[];
}

export function GoodsReceiptModal({ isOpen, onClose, onSuccess, inventoryItems }: GoodsReceiptModalProps) {
  const dispatch = useAppDispatch();
  const { suppliers, actionLoading, actionError } = useAppSelector((state) => state.inventory);
  
  const [formData, setFormData] = useState({
    supplierId: '',
    receiptType: 'PURCHASE',
    referenceNo: '',
    receivedDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [lines, setLines] = useState<{itemId: string, quantity: string, unitCost: string}[]>([
    { itemId: '', quantity: '1', unitCost: '0' }
  ]);
  
  const [toast, setToast] = useState<{show: boolean, type: 'success' | 'error', message: string}>({ show: false, type: 'success', message: '' });

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchSuppliers());
      setFormData({
        supplierId: '',
        receiptType: 'PURCHASE',
        referenceNo: '',
        receivedDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setLines([{ itemId: '', quantity: '1', unitCost: '0' }]);
    }
  }, [isOpen, dispatch]);

  const handleAddLine = () => {
    setLines([...lines, { itemId: '', quantity: '1', unitCost: '0' }]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: string, value: string) => {
    const newLines = [...lines];
    (newLines[index] as any)[field] = value;
    setLines(newLines);
  };

  const calculateTotal = () => {
    return lines.reduce((total, line) => {
      const qty = parseFloat(line.quantity) || 0;
      const cost = parseFloat(line.unitCost) || 0;
      return total + (qty * cost);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate lines
    if (lines.length === 0) {
      setToast({ show: true, type: 'error', message: 'Vui lòng thêm ít nhất 1 mặt hàng' });
      return;
    }
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].itemId || parseFloat(lines[i].quantity) <= 0 || parseFloat(lines[i].unitCost) < 0) {
        setToast({ show: true, type: 'error', message: `Dòng ${i+1} không hợp lệ (Mặt hàng trống hoặc SL <= 0)` });
        return;
      }
    }

    const payload = {
      supplierId: formData.supplierId ? parseInt(formData.supplierId) : null,
      receiptType: formData.receiptType,
      referenceNo: formData.referenceNo,
      receivedDate: new Date(formData.receivedDate).toISOString(),
      notes: formData.notes,
      items: lines.map(l => ({
        itemId: parseInt(l.itemId),
        quantity: parseFloat(l.quantity),
        unitCost: parseFloat(l.unitCost)
      }))
    };

    const resultAction = await dispatch(createReceipt(payload));

    if (resultAction.meta.requestStatus === 'fulfilled') {
      setToast({ show: true, type: 'success', message: 'Nhập kho thành công!' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } else {
      setToast({ show: true, type: 'error', message: actionError || 'Lỗi khi nhập kho' });
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Tạo Phiếu Nhập Kho" size="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Phiếu nhập Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-sm text-on-surface font-medium mb-1">Loại Phiếu Nhập <span className="text-error">*</span></label>
              <select 
                value={formData.receiptType}
                onChange={(e) => setFormData({...formData, receiptType: e.target.value})}
                className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary-container outline-none"
              >
                <option value="PURCHASE">Nhập mua hàng</option>
                <option value="OPENING_STOCK">Nhập tồn đầu kỳ</option>
              </select>
            </div>
            <div>
              <label className="block text-label-sm text-on-surface font-medium mb-1">Nhà cung cấp</label>
              <select 
                value={formData.supplierId}
                onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
                className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary-container outline-none"
              >
                <option value="">-- Chọn Nhà Cung Cấp --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-label-sm text-on-surface font-medium mb-1">Ngày nhập thực tế <span className="text-error">*</span></label>
              <input 
                type="date" 
                value={formData.receivedDate}
                onChange={(e) => setFormData({...formData, receivedDate: e.target.value})}
                className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary-container outline-none"
                required 
              />
            </div>
            <div>
              <label className="block text-label-sm text-on-surface font-medium mb-1">Số chứng từ (Hóa đơn)</label>
              <input 
                type="text" 
                value={formData.referenceNo}
                onChange={(e) => setFormData({...formData, referenceNo: e.target.value})}
                className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary-container outline-none"
                placeholder="Số hóa đơn VAT..."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-label-sm text-on-surface font-medium mb-1">Ghi chú</label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full p-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary-container outline-none"
              rows={2}
            />
          </div>

          {/* Hàng hóa Chi tiết */}
          <div className="border border-outline-variant rounded-lg overflow-hidden">
            <div className="bg-surface-container-low px-4 py-2 border-b border-outline-variant flex justify-between items-center">
              <span className="font-semibold text-on-surface">Danh sách vật tư nhập kho</span>
              <button 
                type="button" 
                onClick={handleAddLine}
                className="flex items-center gap-1 text-primary text-label-sm font-medium hover:underline"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Thêm dòng
              </button>
            </div>
            <div className="p-4 space-y-3 bg-surface-container-lowest max-h-60 overflow-y-auto">
              {lines.map((line, index) => (
                <div key={index} className="flex flex-wrap md:flex-nowrap gap-3 items-end p-3 bg-surface border border-outline-variant/50 rounded-lg">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-label-sm text-outline mb-1">Mặt hàng SKU</label>
                    <select 
                      value={line.itemId}
                      onChange={(e) => handleLineChange(index, 'itemId', e.target.value)}
                      className="w-full h-9 px-2 text-body-sm rounded-md border border-outline-variant bg-surface-container-lowest"
                      required
                    >
                      <option value="">-- Chọn --</option>
                      {inventoryItems.map(item => (
                        <option key={item.id} value={item.id}>[{item.sku}] {item.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-label-sm text-outline mb-1">Số lượng</label>
                    <input 
                      type="number" 
                      value={line.quantity}
                      onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                      className="w-full h-9 px-2 text-body-sm rounded-md border border-outline-variant bg-surface-container-lowest text-right"
                      min="1" step="0.1" required
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-label-sm text-outline mb-1">Đơn giá nhập (đ)</label>
                    <input 
                      type="number" 
                      value={line.unitCost}
                      onChange={(e) => handleLineChange(index, 'unitCost', e.target.value)}
                      className="w-full h-9 px-2 text-body-sm rounded-md border border-outline-variant bg-surface-container-lowest text-right"
                      min="0" required
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-label-sm text-outline mb-1">Thành tiền</label>
                    <div className="h-9 px-2 flex items-center justify-end text-body-sm font-semibold bg-surface-container-low rounded-md text-on-surface-variant">
                      {((parseFloat(line.quantity)||0) * (parseFloat(line.unitCost)||0)).toLocaleString()} ₫
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveLine(index)}
                    className="w-9 h-9 flex items-center justify-center text-error hover:bg-error-container rounded-md transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              ))}
              
              <div className="flex justify-end pt-4 px-2">
                <span className="text-headline-sm font-semibold">Tổng cộng: <span className="text-primary-container">{calculateTotal().toLocaleString()} ₫</span></span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
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
              className="px-6 py-2 bg-primary-container hover:bg-primary text-on-primary font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading ? 'Đang lưu...' : (
                <>
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  Xác nhận Nhập kho
                </>
              )}
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
