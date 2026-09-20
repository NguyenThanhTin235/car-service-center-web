'use client';

import { useAppSelector } from '@/store';

export default function StaffDashboardPage() {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <>
      {/* GREETING & OPERATIONAL TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-on-surface flex items-center gap-2">
            <span>Xin chào,</span>
            <span className="text-primary-container font-bold">{user?.fullName || 'Nhân viên'} 👋</span>
          </h1>
          <p className="text-body-md font-body-md text-on-surface-variant mt-0.5">
            Hôm nay là Thứ Hai, 24/05/2024. Hiện có <strong className="text-error font-semibold">4 xe đang chờ tiếp nhận</strong> và <strong className="text-primary font-semibold">12 lịch hẹn</strong> cần phục vụ.
          </p>
        </div>

        {/* Quick Date & View Actions */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-sm text-label-md font-label-md text-on-surface">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">calendar_month</span>
            <span>Hôm nay: 24/05/2024</span>
            <span className="material-symbols-outlined text-[16px] text-outline">expand_more</span>
          </div>

          <button
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface rounded-lg shadow-sm text-label-md font-label-md transition-colors"
            title="Làm mới bảng"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <button
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface rounded-lg shadow-sm text-label-md font-label-md transition-colors"
            title="Xuất báo cáo ca"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span className="hidden sm:inline">Xuất báo cáo</span>
          </button>
        </div>
      </div>

      {/* 4 POLISHED SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Lịch hẹn hôm nay (Blue Theme) */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-label-md font-label-md text-on-surface-variant font-medium">Lịch hẹn hôm nay</span>
              <div className="text-display-lg font-display-lg text-on-surface font-bold mt-1">28</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-surface-container-low text-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant flex items-center justify-between">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-low text-primary-container font-label-sm text-label-sm font-semibold">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>+12% so với hôm qua</span>
            </div>
            <span className="text-body-sm font-body-sm text-on-surface-variant">8 xe đã vào xưởng</span>
          </div>
        </div>

        {/* Card 2: Xe đang chờ tiếp nhận (Amber/Yellow Theme) */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-label-md font-label-md text-on-surface-variant font-medium">Xe đang chờ tiếp nhận</span>
              <div className="text-display-lg font-display-lg text-on-surface font-bold mt-1 text-on-surface">04</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant flex items-center justify-between">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-label-sm text-label-sm font-semibold">
              <span className="material-symbols-outlined text-[14px]">priority_high</span>
              <span>Cần xử lý gấp (&lt; 15p)</span>
            </div>
            <span className="text-body-sm font-body-sm text-on-surface-variant">2 xe đặt lịch trước</span>
          </div>
        </div>

        {/* Card 3: Xe đã sửa xong (Green/Emerald Theme) */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-label-md font-label-md text-on-surface-variant font-medium">Xe đã sửa xong</span>
              <div className="text-display-lg font-display-lg text-on-surface font-bold mt-1">19</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant flex items-center justify-between">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-label-sm text-label-sm font-semibold">
              <span className="material-symbols-outlined text-[14px]">task_alt</span>
              <span>+8% so với hôm qua</span>
            </div>
            <span className="text-body-sm font-body-sm text-on-surface-variant">15 xe đã thanh toán</span>
          </div>
        </div>

        {/* Card 4: Doanh thu tạm tính (Purple Theme) */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-label-md font-label-md text-on-surface-variant font-medium">Doanh thu tạm tính</span>
              <div className="text-headline-lg font-headline-lg text-on-surface font-bold mt-1.5 truncate">148.500.000 đ</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant flex items-center justify-between">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-label-sm text-label-sm font-semibold">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>+18.4% mục tiêu ngày</span>
            </div>
            <span className="text-body-sm font-body-sm text-on-surface-variant">23 lệnh dịch vụ</span>
          </div>
        </div>
      </div>
      
      {/* Table Placeholder */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-10 flex flex-col items-center justify-center text-on-surface-variant min-h-[300px]">
        <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">table_rows</span>
        <p>Danh sách chờ xử lý sẽ hiển thị ở đây...</p>
      </div>
    </>
  );
}
