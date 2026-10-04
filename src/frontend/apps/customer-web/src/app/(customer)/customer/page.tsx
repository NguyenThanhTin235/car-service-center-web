'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchVehicles } from '@/store/slices/vehicleSlice';

const quickLinks = [
  {
    href: '/customer/vehicles',
    icon: 'directions_car',
    title: 'Xe của tôi',
    desc: 'Xem và quản lý danh sách phương tiện',
    color: 'bg-primary-fixed text-primary',
  },
  {
    href: '/customer/appointments',
    icon: 'calendar_today',
    title: 'Đặt lịch hẹn',
    desc: 'Đặt lịch bảo dưỡng hoặc sửa chữa',
    color: 'bg-tertiary-fixed text-tertiary',
  },
  {
    href: '/customer/profile',
    icon: 'manage_accounts',
    title: 'Hồ sơ cá nhân',
    desc: 'Cập nhật thông tin tài khoản của bạn',
    color: 'bg-secondary-container text-secondary',
  },
];

export default function CustomerDashboardPage() {
  const { user } = useAppSelector((state) => state.auth);
  const { vehicles } = useAppSelector((state) => state.vehicles);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  const activeVehicles = vehicles.filter((v) => v.isActive).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-on-primary rounded-2xl p-6 sm:p-8 mb-6 shadow-sm overflow-hidden relative">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>waving_hand</span>
            <p className="text-sm font-medium opacity-90">Chào mừng trở lại</p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            {user?.fullName || 'Khách hàng'}!
          </h1>
          <p className="text-sm opacity-80 max-w-md">
            Cổng thông tin khách hàng của Car Service Center. Quản lý xe, đặt lịch hẹn và theo dõi lịch sử dịch vụ.
          </p>
        </div>
        {/* Decorative car icon */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10">
          <span className="material-symbols-outlined" style={{ fontSize: '120px' }}>directions_car</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container-highest p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>directions_car</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Xe đang sử dụng</p>
              <p className="text-xl font-bold text-on-surface">{activeVehicles}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container-highest p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Lịch hẹn</p>
              <p className="text-xl font-bold text-on-surface">—</p>
            </div>
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-surface-container-lowest rounded-xl border border-surface-container-highest p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Hạng thành viên</p>
              <p className="text-base font-bold text-on-surface">Thành viên</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-bold text-on-surface mb-3">Thao tác nhanh</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group bg-surface-container-lowest rounded-xl border border-surface-container-highest p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
            >
              <div className={`w-12 h-12 rounded-xl ${link.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px', fontVariationSettings: "'FILL' 1" }}>
                  {link.icon}
                </span>
              </div>
              <h3 className="font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">
                {link.title}
              </h3>
              <p className="text-xs text-on-surface-variant">{link.desc}</p>
              <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Xem ngay</span>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
