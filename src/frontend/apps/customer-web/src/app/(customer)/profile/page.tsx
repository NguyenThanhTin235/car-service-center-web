'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProfile, updateProfile, clearUpdateStatus } from '@/store/slices/profileSlice';

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { data, loading, error, updateLoading, updateError, updateSuccess } = useAppSelector(
    (state) => state.profile
  );

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
  });

  // Load profile on mount
  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  // Sync form when data loads
  useEffect(() => {
    if (data) {
      setForm({
        fullName: data.fullName || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
      });
    }
  }, [data]);

  // Auto-dismiss success message
  useEffect(() => {
    if (updateSuccess) {
      setIsEditing(false);
      const t = setTimeout(() => dispatch(clearUpdateStatus()), 3000);
      return () => clearTimeout(t);
    }
  }, [updateSuccess, dispatch]);

  const handleSave = async () => {
    if (!form.fullName.trim()) return;
    dispatch(updateProfile({
      fullName: form.fullName,
      phone: form.phone,
      email: form.email,
      address: form.address,
    }));
  };

  const handleCancel = () => {
    if (data) {
      setForm({
        fullName: data.fullName || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
      });
    }
    setIsEditing(false);
    dispatch(clearUpdateStatus());
  };

  const inputClass = (editable: boolean) =>
    `w-full px-4 py-2.5 rounded-lg border text-sm transition-all duration-150 ${
      editable
        ? 'border-primary bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'
        : 'border-surface-container-highest bg-surface-container-low text-on-surface cursor-default'
    }`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-on-surface-variant">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="bg-error-container text-on-error-container px-6 py-4 rounded-xl text-sm">
          <span className="material-symbols-outlined align-middle mr-2" style={{ fontSize: '18px' }}>error</span>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-4">
        <a href="/customer" className="hover:text-primary transition-colors">Tổng quan</a>
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_right</span>
        <span className="text-on-surface font-medium">Hồ sơ cá nhân</span>
      </nav>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Hồ sơ cá nhân</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Quản lý thông tin tài khoản của bạn</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
            Chỉnh sửa
          </button>
        )}
      </div>

      {/* Success toast */}
      {updateSuccess && (
        <div className="flex items-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-3 rounded-xl mb-4 text-sm font-medium animate-pulse">
          <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          Cập nhật hồ sơ thành công!
        </div>
      )}

      {/* Error message */}
      {updateError && (
        <div className="flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-xl mb-4 text-sm font-medium">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
          {updateError}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-highest shadow-sm overflow-hidden">
        {/* Avatar header */}
        <div className="bg-gradient-to-r from-primary-fixed to-primary-fixed/50 px-6 py-8 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-lg shrink-0">
            <span className="material-symbols-outlined" style={{ fontSize: '40px', fontVariationSettings: "'FILL' 1" }}>account_circle</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-on-surface">{data?.fullName || 'Khách hàng'}</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">{data?.email}</p>
            <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-fixed text-on-primary-fixed">
              <span className="material-symbols-outlined" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>verified</span>
              Thành viên
            </span>
          </div>
        </div>

        {/* Form fields */}
        <div className="p-6 space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">
              Họ và tên <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              readOnly={!isEditing}
              className={inputClass(isEditing)}
              placeholder="Nhập họ và tên"
            />
          </div>

          {/* Phone + Email row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">
                Số điện thoại
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline" style={{ fontSize: '18px' }}>phone</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  readOnly={!isEditing}
                  className={`${inputClass(isEditing)} pl-10`}
                  placeholder="Nhập số điện thoại"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">
                Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline" style={{ fontSize: '18px' }}>email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  readOnly={!isEditing}
                  className={`${inputClass(isEditing)} pl-10`}
                  placeholder="Nhập email"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">
              Địa chỉ
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 material-symbols-outlined text-outline" style={{ fontSize: '18px' }}>location_on</span>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                readOnly={!isEditing}
                rows={2}
                className={`${inputClass(isEditing)} pl-10 resize-none`}
                placeholder="Nhập địa chỉ"
              />
            </div>
          </div>

          {/* Account info (read-only) */}
          <div className="pt-4 border-t border-surface-container-high">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Thông tin tài khoản</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-on-surface-variant mb-0.5">Ngày tham gia</p>
                <p className="font-medium text-on-surface">
                  {data?.createdAt ? new Date(data.createdAt).toLocaleDateString('vi-VN') : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant mb-0.5">Trạng thái</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${data?.isActive ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {data?.isActive ? 'Đang hoạt động' : 'Bị vô hiệu hóa'}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {isEditing && (
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={updateLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 active:scale-[0.98] transition-all"
              >
                {updateLoading ? (
                  <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
                )}
                {updateLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button
                onClick={handleCancel}
                disabled={updateLoading}
                className="px-5 py-2.5 border border-surface-container-highest text-on-surface-variant rounded-lg text-sm font-medium hover:bg-surface-container-low transition-all"
              >
                Hủy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
