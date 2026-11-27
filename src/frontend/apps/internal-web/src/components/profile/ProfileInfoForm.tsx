'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch } from '@/store';
import { updateAuthUser } from '@/store/slices/authSlice';
import { InternalUserProfile, profileApi } from '@/lib/api/profile.api';
import AddressAutocompleteInput from '@/components/shared/AddressAutocompleteInput';
import { VN_PHONE_REGEX } from './profileUtils';

export interface ProfileInfoFormProps {
  profile: InternalUserProfile;
  onUpdated: (updated: InternalUserProfile) => void;
}

export default function ProfileInfoForm({ profile, onUpdated }: ProfileInfoFormProps) {
  const dispatch = useAppDispatch();
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [address, setAddress] = useState(profile.address || '');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ fullName?: string; phone?: string }>({});

  useEffect(() => {
    setFullName(profile.fullName || '');
    setPhone(profile.phone || '');
    setAddress(profile.address || '');
    setFieldErrors({});
  }, [profile]);

  const trimmedName = fullName.trim();
  const trimmedPhone = phone.trim();
  const trimmedAddress = address.trim();

  const isDirty =
    trimmedName !== (profile.fullName || '').trim() ||
    trimmedPhone !== (profile.phone || '').trim() ||
    trimmedAddress !== (profile.address || '').trim();

  const validate = () => {
    const errors: { fullName?: string; phone?: string } = {};
    if (trimmedName.length < 2) {
      errors.fullName = 'Họ và tên phải có ít nhất 2 ký tự.';
    } else if (trimmedName.length > 150) {
      errors.fullName = 'Họ và tên không được vượt quá 150 ký tự.';
    } else if (
      trimmedName !== (profile.fullName || '').trim() &&
      !/^[\p{L}\s]+$/u.test(trimmedName)
    ) {
      errors.fullName = 'Vui lòng nhập họ và tên hợp lệ, không nhập số hoặc ký tự đặc biệt.';
    }

    if (trimmedPhone && !VN_PHONE_REGEX.test(trimmedPhone)) {
      errors.phone = 'Số điện thoại không đúng định dạng Việt Nam (VD: 0901234567).';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReset = () => {
    setFullName(profile.fullName || '');
    setPhone(profile.phone || '');
    setAddress(profile.address || '');
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const updated = await profileApi.updateMyProfile({
        fullName: trimmedName,
        phone: trimmedPhone || null,
        address: trimmedAddress || null,
      });
      onUpdated(updated);
      dispatch(updateAuthUser({ fullName: updated.fullName }));
      toast.success('Cập nhật thông tin cá nhân thành công.');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Không thể cập nhật thông tin cá nhân. Vui lòng thử lại.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>
      <div>
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Thông tin liên hệ & Hiển thị
        </h3>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
          Cập nhật họ tên, số điện thoại và địa chỉ liên hệ. Thay đổi sẽ đồng bộ ngay trên toàn hệ thống.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="profile-full-name"
            className="block text-xs font-semibold text-slate-800"
          >
            Họ và tên <span className="text-rose-600">*</span>
          </label>
          <input
            id="profile-full-name"
            data-testid="profile-input-fullname"
            type="text"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (fieldErrors.fullName) setFieldErrors((p) => ({ ...p, fullName: undefined }));
            }}
            placeholder="Nhập họ và tên đầy đủ"
            className={`w-full min-h-[44px] px-3.5 rounded-xl bg-white border text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0050cd]/30 ${
              fieldErrors.fullName
                ? 'border-rose-500 focus:border-rose-500'
                : 'border-slate-300 focus:border-[#0050cd]'
            }`}
          />
          {fieldErrors.fullName && (
            <p className="text-xs font-medium text-rose-600">{fieldErrors.fullName}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label
            htmlFor="profile-phone"
            className="block text-xs font-semibold text-slate-800"
          >
            Số điện thoại
          </label>
          <input
            id="profile-phone"
            data-testid="profile-input-phone"
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: undefined }));
            }}
            placeholder="VD: 0901234567"
            className={`w-full min-h-[44px] px-3.5 rounded-xl bg-white border font-mono tabular-nums text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-sans transition-colors focus:outline-none focus:ring-2 focus:ring-[#0050cd]/30 ${
              fieldErrors.phone
                ? 'border-rose-500 focus:border-rose-500'
                : 'border-slate-300 focus:border-[#0050cd]'
            }`}
          />
          {fieldErrors.phone && (
            <p className="text-xs font-medium text-rose-600">{fieldErrors.phone}</p>
          )}
        </div>
      </div>

      {/* Email (Read-only for internal roles) */}
      <div className="space-y-1.5">
        <label
          htmlFor="profile-email"
          className="flex items-center justify-between text-xs font-semibold text-slate-800"
        >
          <span>Email đăng nhập</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Chỉ đọc
          </span>
        </label>
        <input
          id="profile-email"
          data-testid="profile-input-email"
          type="email"
          value={profile.email}
          readOnly
          disabled
          className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-100/90 border border-slate-200 text-sm text-slate-600 cursor-not-allowed"
        />
        <p className="text-xs text-slate-500">
          Email đăng nhập do Quản trị viên cấp và quản lý phân quyền. Vui lòng liên hệ Quản trị viên nếu cần thay đổi.
        </p>
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <label
          htmlFor="profile-address"
          className="block text-xs font-semibold text-slate-800"
        >
          Địa chỉ liên hệ
        </label>
        <AddressAutocompleteInput
          id="profile-address"
          dataTestId="profile-input-address"
          value={address}
          onChange={setAddress}
          placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố..."
          className="w-full h-11 pr-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:border-[#0050cd] focus:ring-2 focus:ring-[#0050cd]/30"
        />
      </div>

      {/* Action Bar */}
      <div className="pt-5 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          {isDirty ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="font-medium text-amber-700">Bạn có thay đổi chưa lưu</span>
            </>
          ) : (
            <span>Thông tin đã được đồng bộ mới nhất</span>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            disabled={!isDirty || submitting}
            className="min-h-[44px] px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 transition-all duration-150 active:scale-[0.99] cursor-pointer"
          >
            Hủy thay đổi
          </button>
          <button
            type="submit"
            data-testid="profile-save-btn"
            disabled={!isDirty || submitting}
            className="min-h-[44px] px-5 rounded-xl bg-[#0050cd] hover:bg-[#0866ff] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.99] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050cd]/40"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined text-[17px] animate-spin">
                  progress_activity
                </span>
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[17px]">save</span>
                <span>Lưu thay đổi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
