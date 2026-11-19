'use client';

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchMyTrackingOrders } from '@/store/slices/trackingSlice';

export type CustomerTabKey =
  | 'overview'
  | 'profile'
  | 'vehicles'
  | 'appointments'
  | 'tracking'
  | 'invoices'
  | 'history';

interface CustomerOverviewTabProps {
  onSelectTab: (tab: CustomerTabKey) => void;
}

export default function CustomerOverviewTab({ onSelectTab }: CustomerOverviewTabProps) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { vehicles } = useAppSelector((state) => state.vehicles);
  const { orders } = useAppSelector((state) => state.tracking);

  useEffect(() => {
    dispatch(fetchMyTrackingOrders());
  }, [dispatch]);

  const activeVehicles = vehicles.filter((v) => v.isActive).length;
  const activeOrder = orders.length > 0 ? orders[0] : null;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-on-primary rounded-2xl p-6 sm:p-8 shadow-sm overflow-hidden relative">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              waving_hand
            </span>
            <p className="text-sm font-medium opacity-90">Chào mừng trở lại</p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            {user?.fullName || 'Khách hàng'}!
          </h1>
          <p className="text-sm opacity-85 max-w-lg">
            Cổng thông tin khách hàng Car Service Center. Quản lý phương tiện, theo dõi tiến độ sửa chữa và tra cứu hóa đơn dịch vụ.
          </p>
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10">
          <span className="material-symbols-outlined text-[140px]">directions_car</span>
        </div>
      </div>

      {/* Active Work Order Banner */}
      {activeOrder && (
        <div className="bg-surface-container-lowest border-2 border-primary/40 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
                <span
                  className="material-symbols-outlined text-[24px] animate-spin"
                  style={{ animationDuration: '6s' }}
                >
                  build
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md border border-on-surface bg-white text-on-surface font-mono font-extrabold text-xs">
                    {activeOrder.vehicle.licensePlate}
                  </span>
                  <span className="text-xs font-bold text-primary">
                    Xe đang thực hiện dịch vụ ({activeOrder.progressPercent}%)
                  </span>
                </div>
                <p className="text-sm font-semibold text-on-surface mt-1">
                  {activeOrder.vehicle.make} {activeOrder.vehicle.model} • Giai đoạn:{' '}
                  {activeOrder.steps[activeOrder.currentStep - 1]?.title}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Cố vấn phụ trách:{' '}
                  <strong className="text-on-surface">{activeOrder.advisor.fullName}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectTab('tracking')}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-on-primary rounded-xl text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-all shadow-2xs shrink-0 cursor-pointer"
            >
              <span>Theo dõi trực tiếp</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container-highest p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                directions_car
              </span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Xe đang sở hữu</p>
              <p className="text-xl font-bold text-on-surface tabular-nums">{activeVehicles}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-surface-container-highest p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary-fixed flex items-center justify-center text-secondary">
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                receipt_long
              </span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Xe tại xưởng</p>
              <p className="text-xl font-bold text-on-surface tabular-nums">{orders.length}</p>
            </div>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-surface-container-lowest rounded-xl border border-surface-container-highest p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                workspace_premium
              </span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Hạng thành viên</p>
              <p className="text-base font-bold text-on-surface">Thành viên VIP</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
