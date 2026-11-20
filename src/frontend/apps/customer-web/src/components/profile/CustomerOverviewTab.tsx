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
    <div className="space-y-5">
      {/* Welcome Banner */}
      <div className="hero-banner-surface text-white rounded-2xl p-6 sm:p-7 overflow-hidden relative animate-fadeIn">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="material-symbols-outlined text-lg text-white/90"
              aria-hidden="true"
            >
              waving_hand
            </span>
            <p className="text-xs sm:text-sm font-medium text-white/85">Chào mừng trở lại</p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] mb-1.5">
            {user?.fullName || 'Khách hàng'}
          </h1>
          <p className="text-sm text-white/80 max-w-xl leading-relaxed">
            Cổng thông tin khách hàng AutoCare Pro. Quản lý phương tiện, theo dõi tiến độ sửa chữa
            và thanh toán hóa đơn SePay trực tuyến.
          </p>
        </div>
      </div>

      {/* Active Work Order Banner */}
      {activeOrder && (
        <div
          style={{ animationDelay: '60ms' }}
          className="bg-surface-elevated border border-accent/30 rounded-2xl p-5 animate-fadeIn"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-accent text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl" aria-hidden="true">
                  build
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md border border-hairline-strong bg-surface-elevated text-ink-primary font-mono tabular-nums font-bold text-xs uppercase tracking-wider">
                    {activeOrder.vehicle.licensePlate}
                  </span>
                  <span className="text-xs font-semibold text-accent font-mono tabular-nums">
                    Đang thực hiện ({activeOrder.progressPercent}%)
                  </span>
                </div>
                <p className="text-sm font-semibold text-ink-primary mt-1.5">
                  {activeOrder.vehicle.make} {activeOrder.vehicle.model} · Giai đoạn:{' '}
                  {activeOrder.steps[activeOrder.currentStep - 1]?.title}
                </p>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Cố vấn phụ trách:{' '}
                  <strong className="font-semibold text-ink-primary">
                    {activeOrder.advisor.fullName}
                  </strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectTab('tracking')}
              className="group/cta inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 bg-accent hover:bg-accent-hover active:scale-[0.97] text-white rounded-xl text-xs sm:text-sm font-semibold transition-[background-color,transform] duration-150 ease-out shrink-0 cursor-pointer"
            >
              <span>Theo dõi trực tiếp</span>
              <span
                className="material-symbols-outlined text-base transition-transform duration-150 ease-[cubic-bezier(0.165,0.84,0.44,1)] group-hover/cta:translate-x-0.5"
                aria-hidden="true"
              >
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div
        style={{ animationDelay: activeOrder ? '120ms' : '60ms' }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn"
      >
        <button
          type="button"
          onClick={() => onSelectTab('vehicles')}
          className="group text-left bg-surface-elevated rounded-2xl border border-hairline hover:border-accent/40 hover:shadow-[0_10px_24px_-10px_rgba(0,80,205,0.16)] active:scale-[0.98] p-4 sm:p-5 transition-[border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.165,0.84,0.44,1)] cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-accent-soft flex items-center justify-center text-accent shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.165,0.84,0.44,1)] group-hover:scale-105">
              <span className="material-symbols-outlined text-xl" aria-hidden="true">
                directions_car
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-secondary">Xe đang sở hữu</p>
              <p className="text-xl font-bold text-ink-primary font-mono tabular-nums mt-0.5">
                {activeVehicles}
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('tracking')}
          className="group text-left bg-surface-elevated rounded-2xl border border-hairline hover:border-accent/40 hover:shadow-[0_10px_24px_-10px_rgba(0,80,205,0.16)] active:scale-[0.98] p-4 sm:p-5 transition-[border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.165,0.84,0.44,1)] cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-status-success-soft flex items-center justify-center text-status-success shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.165,0.84,0.44,1)] group-hover:scale-105">
              <span className="material-symbols-outlined text-xl" aria-hidden="true">
                receipt_long
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-secondary">Xe tại xưởng</p>
              <p className="text-xl font-bold text-ink-primary font-mono tabular-nums mt-0.5">
                {orders.length}
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('profile')}
          className="group text-left bg-surface-elevated rounded-2xl border border-hairline hover:border-accent/40 hover:shadow-[0_10px_24px_-10px_rgba(0,80,205,0.16)] active:scale-[0.98] p-4 sm:p-5 transition-[border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.165,0.84,0.44,1)] cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-bronze-soft flex items-center justify-center text-bronze-ink shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.165,0.84,0.44,1)] group-hover:scale-105">
              <span className="material-symbols-outlined text-xl" aria-hidden="true">
                verified_user
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink-secondary">Tài khoản</p>
              <p className="text-sm font-bold text-ink-primary truncate mt-0.5">
                Khách hàng AutoCare Pro
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
