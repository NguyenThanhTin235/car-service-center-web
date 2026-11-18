'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { createSupplier, updateSupplier, Supplier } from '@/store/slices/inventorySlice';
import Modal from '@/components/shared/Modal';
import Toast from '@/components/shared/Toast';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  onSuccess: () => void;
}

export function SupplierModal({ isOpen, onClose, supplier, onSuccess }: SupplierModalProps) {
  const dispatch = useAppDispatch();
  const { actionLoading } = useAppSelector((state) => state.inventory);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    taxCode: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
  });
  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });

  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        setFormData({
          code: supplier.code || '',
          name: supplier.name || '',
          taxCode: supplier.taxCode || '',
          contactPerson: supplier.contactPerson || '',
          phone: supplier.phone || '',
          email: supplier.email || '',
          address: supplier.address || '',
        });
      } else {
        setFormData({
          code: '',
          name: '',
          taxCode: '',
          contactPerson: '',
          phone: '',
          email: '',
          address: '',
        });
      }
    }
  }, [isOpen, supplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setToast({ show: true, type: 'error', message: 'Vui lòng nhập tên Nhà cung cấp' });
      return;
    }

    const res = supplier
      ? await dispatch(updateSupplier({ id: supplier.id, data: formData }))
      : await dispatch(createSupplier(formData));

    if (res.meta.requestStatus === 'fulfilled') {
      setToast({
        show: true,
        type: 'success',
        message: supplier ? 'Cập nhật Nhà cung cấp thành công!' : 'Thêm Nhà cung cấp thành công!',
      });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } else {
      setToast({
        show: true,
        type: 'error',
        message: (res.payload as string) || 'Lỗi khi lưu thông tin Nhà cung cấp',
      });
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={supplier ? 'Cập nhật Nhà cung cấp' : 'Thêm Nhà cung cấp mới'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mã NCC (Tự sinh nếu để trống)
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="VD: NCC-011"
                className="w-full h-9 px-3 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:border-[#0866ff] outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên Doanh nghiệp / Nhà cung cấp <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Công ty TNHH Phụ tùng Bosch Việt Nam"
                className="w-full h-9 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:border-[#0866ff] outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mã số thuế</label>
              <input
                type="text"
                value={formData.taxCode}
                onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                placeholder="VD: 0301234567"
                className="w-full h-9 px-3 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:border-[#0866ff] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Người liên hệ</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="Họ tên đại diện..."
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white focus:border-[#0866ff] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="VD: 02838123456"
                className="w-full h-9 px-3 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:border-[#0866ff] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="lienhe@nhacungcap.vn"
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white focus:border-[#0866ff] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ trụ sở / Kho</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố..."
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white focus:border-[#0866ff] outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="h-9 px-5 rounded-xl bg-gradient-to-r from-[#0866ff] to-[#0050cd] text-white text-xs font-bold shadow-sm cursor-pointer"
            >
              {actionLoading ? 'Đang lưu...' : supplier ? 'Lưu thay đổi' : 'Thêm Nhà cung cấp'}
            </button>
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

