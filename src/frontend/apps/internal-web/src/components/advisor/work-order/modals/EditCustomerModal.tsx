'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { updateCustomerInfo } from '@/lib/api/work-order.api';

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    id: number;
    full_name?: string;
    phone?: string;
    email?: string;
    address?: string;
  } | null;
  onSuccess: () => void;
}

export default function EditCustomerModal({
  isOpen,
  onClose,
  customer,
  onSuccess,
}: EditCustomerModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (customer && isOpen) {
      setFullName(customer.full_name || '');
      setPhone(customer.phone || '');
      setEmail(customer.email || '');
      setAddress(customer.address || '');
    }
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Họ và tên khách hàng không được để trống');
      return;
    }
    if (!phone.trim()) {
      toast.error('Số điện thoại không được để trống');
      return;
    }

    try {
      setSubmitting(true);
      const res = await updateCustomerInfo(customer.id, {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      });

      if (res && !res.success) {
        throw new Error(res.message || 'Lỗi khi cập nhật thông tin khách hàng');
      }

      toast.success('Cập nhật thông tin khách hàng thành công!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Lỗi khi cập nhật khách hàng');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-[28px] max-w-lg w-full p-6 shadow-2xl border border-slate-200/90 flex flex-col gap-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-customer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0c2340] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">person</span>
            </div>
            <div>
              <h2 id="edit-customer-title" className="text-base font-extrabold text-zinc-900 tracking-tight">
                Sửa Thông Tin Khách Hàng
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Cập nhật tên, số điện thoại liên hệ và email
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-zinc-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          {/* Họ và tên */}
          <div>
            <label className="block font-bold text-zinc-700 mb-1">
              Họ và tên khách hàng <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-bold text-sm text-zinc-900 focus:outline-none focus:border-[#0050cd] focus:bg-white"
              required
            />
          </div>

          {/* SĐT & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                Số điện thoại <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0901234567"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-mono font-bold text-zinc-900 focus:outline-none focus:border-[#0050cd] focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Địa chỉ Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="VD: email@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-medium text-zinc-800 focus:outline-none focus:border-[#0050cd] focus:bg-white"
              />
            </div>
          </div>

          {/* Địa chỉ */}
          <div>
            <label className="block font-bold text-zinc-700 mb-1">Địa chỉ liên hệ</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="VD: 123 Nguyễn Huệ, Q.1, TP.HCM"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-medium text-zinc-800 focus:outline-none focus:border-[#0050cd] focus:bg-white"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#0c2340] hover:bg-[#07172c] disabled:opacity-50 text-white font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
