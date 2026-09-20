'use client';

import React from 'react';
import Link from 'next/link';
import LogoutButton from '@/components/shared/LogoutButton';

export default function CustomerDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
            <span className="material-symbols-outlined">directions_car</span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900 leading-tight">AutoCare Pro — Customer Portal</h1>
            <p className="text-xs text-gray-500">Cổng thông tin Khách hàng</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/home" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Trang chủ</Link>
          <LogoutButton className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1" />
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-10">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl">account_circle</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Xin chào Khách hàng!</h2>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Tài khoản của bạn đã được xác thực thành công. Cổng thông tin khách hàng đang được chuẩn bị cho các tính năng tiếp theo (Đặt lịch, Quản lý xe, Xem báo giá).
          </p>
          <Link href="/home" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md">
            <span className="material-symbols-outlined text-xl">home</span>
            Quay về Trang chủ
          </Link>
        </div>
      </main>
    </div>
  );
}
