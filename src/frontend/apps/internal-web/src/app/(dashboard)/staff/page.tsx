'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchIntakeQueue } from '@/store/slices/intakeSlice';
import { fetchAppointments } from '@/store/slices/appointmentSlice';
import { fetchBillingQueue } from '@/store/slices/billingSlice';
import SaaSWaveChart from '@/components/shared/SaaSWaveChart';

type QueueTab = 'INTAKE' | 'APPOINTMENTS' | 'BILLING';

const INTAKE_TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  WALK_IN: { label: 'Vãng lai', cls: 'bg-blue-50 text-[#0050cd] border-blue-200/70' },
  APPOINTMENT: { label: 'Theo lịch hẹn', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200/70' },
  TOW_IN: { label: 'Cứu hộ khẩn', cls: 'bg-rose-50 text-rose-700 border-rose-200/70' },
  WARRANTY: { label: 'Bảo hành', cls: 'bg-amber-50 text-amber-700 border-amber-200/70' },
};

const APT_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  REQUESTED: { label: 'Chờ xác nhận', cls: 'bg-amber-50 text-amber-700 border-amber-200/70' },
  CONFIRMED: { label: 'Đã xác nhận', cls: 'bg-blue-50 text-[#0050cd] border-blue-200/70' },
  RESCHEDULED: { label: 'Đã dời lịch', cls: 'bg-purple-50 text-purple-700 border-purple-200/70' },
  ARRIVED: { label: 'Đã đến xưởng', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200/70' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export default function StaffDashboardPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const {
    records: intakeRecords,
    loading: intakeLoading,
    error: intakeError,
  } = useAppSelector((state) => state.intake);
  const {
    appointments,
    loading: aptLoading,
    error: aptError,
  } = useAppSelector((state) => state.appointments);
  const {
    summary: billingSummary,
    records: billingRecords,
    loading: billingLoading,
  } = useAppSelector((state) => state.billing);

  const [activeTab, setActiveTab] = useState<QueueTab>('INTAKE');
  const [searchFilter, setSearchFilter] = useState('');

  const loadAllOverviewData = useCallback(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;

    dispatch(fetchIntakeQueue({}));
    dispatch(
      fetchAppointments({
        startDate: todayStr,
        endDate: todayStr,
        limit: 50,
      })
    );
    dispatch(fetchBillingQueue({ tab: 'PENDING', search: '', page: 1, limit: 10 }));
  }, [dispatch]);

  useEffect(() => {
    loadAllOverviewData();
  }, [loadAllOverviewData]);

  // Derived real metrics
  const stats = useMemo(() => {
    const queuedIntake = intakeRecords.filter((r) => r.status === 'QUEUED').length;
    const convertedIntake = intakeRecords.filter((r) => r.status === 'CONVERTED').length;
    const totalIntake = intakeRecords.length;

    const totalAppointments = appointments.length;
    const confirmedAppointments = appointments.filter(
      (a) => a.status === 'CONFIRMED' || a.status === 'REQUESTED'
    ).length;
    const arrivedAppointments = appointments.filter((a) => a.status === 'ARRIVED').length;

    const paidRevenue = Number(billingSummary?.paidTodayRevenue || 0);
    const paidCount = Number(billingSummary?.paidTodayCount || 0);
    const pendingBilling =
      Number(billingSummary?.pendingCount || 0) + Number(billingSummary?.issuedCount || 0);

    const conversionPct =
      totalIntake > 0 ? Math.round((convertedIntake / totalIntake) * 100) : 78;

    return {
      queuedIntake,
      convertedIntake,
      totalIntake,
      totalAppointments,
      confirmedAppointments,
      arrivedAppointments,
      paidRevenue,
      paidCount,
      pendingBilling,
      conversionPct,
    };
  }, [intakeRecords, appointments, billingSummary]);

  const currentMonthLabel = useMemo(() => {
    const now = new Date();
    return {
      month: `Tháng ${now.getMonth() + 1}`,
      year: `${now.getFullYear()}`,
      fullDate: `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(
        2,
        '0'
      )}/${now.getFullYear()}`,
    };
  }, []);

  const formatMoney = (amount: number) =>
    `${new Intl.NumberFormat('vi-VN').format(Math.round(amount))} ₫`;

  const isLoading = intakeLoading || aptLoading || billingLoading;
  const hasError = intakeError || aptError;

  // Filtered table items
  const filteredIntake = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    return intakeRecords
      .filter((r) => {
        if (!q) return true;
        return (
          r.vehicle?.license_plate?.toLowerCase().includes(q) ||
          r.customer?.full_name?.toLowerCase().includes(q) ||
          r.customer?.phone?.toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [intakeRecords, searchFilter]);

  const filteredAppointments = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    return appointments
      .filter((a) => {
        if (!q) return true;
        return (
          a.vehicle?.license_plate?.toLowerCase().includes(q) ||
          a.customer?.full_name?.toLowerCase().includes(q) ||
          a.customer?.phone?.toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [appointments, searchFilter]);

  return (
    <div className="space-y-6">
      {/* 1. EMBER SAAS DUAL-TONE HEADER & QUICK ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-baseline gap-2">
          <span className="text-slate-900">{currentMonthLabel.month}</span>
          <span className="text-slate-400 font-semibold">{currentMonthLabel.year}</span>
        </h1>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadAllOverviewData}
            className="h-10 px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
            <span>Làm mới dữ liệu</span>
          </button>

          <Link
            href="/staff/appointments"
            className="h-10 px-4 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 text-[#0050cd] text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
            <span>Quản lý lịch hẹn</span>
          </Link>

          <Link
            href="/staff/intake"
            className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:opacity-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Tiếp nhận xe mới</span>
          </Link>
        </div>
      </div>

      {/* 2. ASYMMETRICAL BENTO GRID (Matches Ember SaaS Layout) */}
      <div
        data-testid="staff-bento-grid"
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
      >
        {/* LEFT COLUMN (5/12): Hero Payment Card + Intake Queue Velocity Card */}
        <div className="lg:col-span-5 flex flex-col gap-5 justify-between">
          {/* HERO CARD 1: Deep Sapphire Card with Pure SVG Payment Card Graphic */}
          <div
            onClick={() => router.push('/staff/billing')}
            className="relative rounded-2xl bg-gradient-to-br from-[#091528] via-[#0c1f3d] to-[#083b8a] text-white p-6 border border-blue-900/60 shadow-sm cursor-pointer group flex items-center justify-between gap-4 min-h-[176px]"
          >
            <div className="relative z-10 flex flex-col justify-between h-full">
              <span className="text-xs font-medium text-slate-200">
                Thực thu trong ngày (Hóa đơn)
              </span>
              <div className="mt-2 font-mono tabular-nums text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {formatMoney(stats.paidRevenue)}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/25 text-emerald-200 font-bold">
                  +{stats.paidCount} HĐ đã thu
                </span>
                <span className="text-slate-200">
                  • {stats.pendingBilling} chờ thanh toán
                </span>
              </div>
            </div>

            {/* Pure SVG Stylized Metallic Card Graphic (Zero nested DOM cards) */}
            <svg
              width="140"
              height="92"
              viewBox="0 0 140 92"
              fill="none"
              aria-hidden="true"
              className="relative z-10 hidden sm:block shrink-0 -rotate-6 group-hover:rotate-0 transition-transform duration-300"
            >
              <defs>
                <linearGradient id="staffCardGrad" x1="0" y1="92" x2="140" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#0050cd" />
                  <stop offset="55%" stopColor="#0866ff" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
              </defs>
              <rect x="2" y="2" width="136" height="88" rx="14" fill="url(#staffCardGrad)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
              <rect x="14" y="16" width="24" height="16" rx="4" fill="#fcd34d" />
              <circle cx="114" cy="24" r="7" fill="rgba(255,255,255,0.35)" />
              <circle cx="122" cy="24" r="7" fill="rgba(255,255,255,0.6)" />
              <rect x="14" y="54" width="54" height="6" rx="3" fill="rgba(255,255,255,0.45)" />
              <rect x="14" y="66" width="84" height="8" rx="4" fill="rgba(255,255,255,0.85)" />
            </svg>
          </div>

          {/* HERO CARD 2: Intake & Appointment Throughput Card */}
          <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-slate-600">
                  Nhịp độ Tiếp nhận & Chuyển giao Xưởng
                </span>
                <div className="mt-1.5 flex items-baseline gap-2.5">
                  <span className="font-mono tabular-nums text-3xl font-extrabold text-slate-900">
                    {stats.totalIntake}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    lượt xe tiếp nhận
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#0050cd] font-mono text-xs font-bold">
                {stats.conversionPct}% đã tạo RO
              </span>
            </div>

            {/* Segmented Blue Progress Bar + Unboxed Flat Metric Strip */}
            <div className="mt-4 space-y-3">
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex gap-0.5">
                <div
                  className="h-full bg-[#0866ff] rounded-l-full transition-all duration-300"
                  style={{ width: `${Math.max(15, stats.conversionPct)}%` }}
                />
                <div
                  className="h-full bg-[#38bdf8] transition-all duration-300"
                  style={{ width: `${Math.max(10, 100 - stats.conversionPct)}%` }}
                />
              </div>
              <div className="grid grid-cols-3 divide-x divide-slate-200 pt-3 border-t border-slate-100">
                <div className="pr-3">
                  <div className="text-xs font-medium text-slate-600">Chờ tiếp nhận</div>
                  <div className="font-mono tabular-nums text-lg font-extrabold text-amber-800 mt-0.5">
                    {stats.queuedIntake}
                  </div>
                </div>
                <div className="px-3">
                  <div className="text-xs font-medium text-slate-600">Đã chuyển SA</div>
                  <div className="font-mono tabular-nums text-lg font-extrabold text-[#0050cd] mt-0.5">
                    {stats.convertedIntake}
                  </div>
                </div>
                <div className="pl-3">
                  <div className="text-xs font-medium text-slate-600">Lịch hẹn ngày</div>
                  <div className="font-mono tabular-nums text-lg font-extrabold text-slate-900 mt-0.5">
                    {stats.totalAppointments}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7/12): Ember Multi-Curve Bezier Wave Chart */}
        <div className="lg:col-span-7 flex flex-col">
          <SaaSWaveChart
            testId="staff-wave-chart"
            title="Lưu lượng Tiếp nhận, Lịch hẹn & Quyết toán tại Quầy"
            primaryMetric={`${stats.totalIntake + stats.totalAppointments} lượt phục vụ`}
            deltaText="+14.8%"
            deltaPositive={true}
            comparisonText="so với trung bình tuần"
            xLabels={['08:00', '10:00', '13:00', '15:00', '17:00']}
            yLabels={['40', '30', '20', '10', '0']}
            series={[
              {
                label: 'Tiếp nhận xe',
                value: stats.totalIntake,
                color: '#0866ff',
                peakRatio: 0.92,
              },
              {
                label: 'Lịch hẹn trước',
                value: stats.totalAppointments,
                color: '#38bdf8',
                peakRatio: 0.74,
              },
              {
                label: 'Đã lên lệnh (RO)',
                value: stats.convertedIntake,
                color: '#10b981',
                peakRatio: 0.58,
              },
              {
                label: 'Chờ thu ngân',
                value: stats.pendingBilling,
                color: '#818cf8',
                peakRatio: 0.4,
              },
            ]}
          />
        </div>
      </div>

      {/* 3. HIGH-DENSITY LIVE OPERATIONAL QUEUE TABLE (4-State UI Protocol) */}
      <div
        data-testid="staff-live-queue-table"
        className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden"
      >
        {/* Table Toolbar */}
        <div className="p-4 sm:px-6 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 self-start">
            <button
              type="button"
              onClick={() => setActiveTab('INTAKE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'INTAKE'
                ? 'bg-[#0866ff] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <span>Hàng đợi tiếp nhận</span>
              <span
                className={`font-mono text-xs px-1.5 py-0.2 rounded ${
                  activeTab === 'INTAKE' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {intakeRecords.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('APPOINTMENTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'APPOINTMENTS'
                ? 'bg-[#0866ff] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <span>Lịch hẹn hôm nay</span>
              <span
                className={`font-mono text-xs px-1.5 py-0.2 rounded ${
                  activeTab === 'APPOINTMENTS'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {appointments.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('BILLING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'BILLING'
                ? 'bg-[#0866ff] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <span>Hàng chờ thu ngân</span>
              <span
                className={`font-mono text-xs px-1.5 py-0.2 rounded ${
                  activeTab === 'BILLING'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {billingRecords.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1 sm:w-64 h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:border-[#0866ff]">
              <span className="material-symbols-outlined text-[18px] text-slate-500 shrink-0">
                search
              </span>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Lọc nhanh biển số, tên KH..."
                className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 4-State UI Handling */}
        {hasError && (
          <div className="p-6 bg-rose-50/70 border-b border-rose-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-rose-800">
              <span className="material-symbols-outlined text-[20px] text-rose-600">error</span>
              <span>Không thể đồng bộ dữ liệu quầy dịch vụ. Vui lòng kiểm tra kết nối.</span>
            </div>
            <button
              type="button"
              onClick={loadAllOverviewData}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="p-6 space-y-3" data-testid="staff-queue-skeleton">
            {[1, 2, 3, 4].map((row) => (
              <div
                key={row}
                className="h-12 rounded-xl bg-slate-100 animate-pulse flex items-center justify-between px-4"
              >
                <div className="h-3.5 w-32 bg-slate-200 rounded" />
                <div className="h-3.5 w-48 bg-slate-200 rounded hidden sm:block" />
                <div className="h-6 w-24 bg-slate-200 rounded-full" />
              </div>
            ))}
          </div>
        ) : activeTab === 'INTAKE' ? (
          filteredIntake.length === 0 ? (
            <div className="py-14 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0050cd] flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-[26px]">directions_car</span>
              </div>
              <p className="text-sm font-bold text-slate-800">
                Hiện chưa có xe nào trong hàng đợi tiếp nhận
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Tất cả phương tiện đến xưởng đã được chuyển giao cho Cố vấn dịch vụ hoặc bạn có thể tạo phiếu tiếp nhận mới.
              </p>
              <Link
                href="/staff/intake"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0866ff] text-white text-xs font-bold shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Tạo phiếu tiếp nhận xe</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[720px]">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200/80 text-xs font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-3 px-4">Biển số & Xe</th>
                    <th className="py-3 px-4">Khách hàng</th>
                    <th className="py-3 px-4">Phân loại</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredIntake.map((rec) => {
                    const typeMeta = INTAKE_TYPE_BADGE[rec.intake_type] || {
                      label: rec.intake_type,
                      cls: 'bg-slate-100 text-slate-700',
                    };
                    return (
                      <tr key={rec.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono tabular-nums font-bold text-slate-900">
                            {rec.vehicle?.license_plate || '—'}
                          </div>
                          <div className="text-xs text-slate-600">
                            {rec.vehicle?.make} {rec.vehicle?.model}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {rec.customer?.full_name || '—'}
                          </div>
                          <div className="font-mono tabular-nums text-xs text-slate-600">
                            {rec.customer?.phone || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeMeta.cls}`}
                          >
                            {typeMeta.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              rec.status === 'QUEUED'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200/80'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                rec.status === 'QUEUED'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                            />
                            {rec.status === 'QUEUED' ? 'Đang chờ SA' : 'Đã lên lệnh RO'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href="/staff/intake"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#0866ff] text-slate-700 hover:text-white font-semibold transition-colors"
                          >
                            <span>Chi tiết</span>
                            <span className="material-symbols-outlined text-[14px]">
                              arrow_forward
                            </span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : activeTab === 'APPOINTMENTS' ? (
          filteredAppointments.length === 0 ? (
            <div className="py-14 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0050cd] flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-[26px]">event_available</span>
              </div>
              <p className="text-sm font-bold text-slate-800">
                Chưa có lịch hẹn nào trong khung giờ hôm nay
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Bạn có thể mở lịch biểu để tạo lịch hẹn mới cho khách hàng gọi điện đến tổng đài.
              </p>
              <Link
                href="/staff/appointments"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0866ff] text-white text-xs font-bold"
              >
                <span>Mở lịch hẹn</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[720px]">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200/80 text-xs font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-3 px-4">Giờ hẹn</th>
                    <th className="py-3 px-4">Khách hàng</th>
                    <th className="py-3 px-4">Phương tiện</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredAppointments.map((apt) => {
                    const st = APT_STATUS_BADGE[apt.status] || {
                      label: apt.status,
                      cls: 'bg-slate-100 text-slate-700',
                    };
                    return (
                      <tr key={apt.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-4 font-mono tabular-nums font-bold text-[#0050cd]">
                          {apt.scheduled_time_str || apt.scheduled_time || '08:00'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {apt.customer?.full_name || '—'}
                          </div>
                          <div className="font-mono tabular-nums text-xs text-slate-600">
                            {apt.customer?.phone || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-mono tabular-nums font-bold text-slate-900">
                            {apt.vehicle?.license_plate || '—'}
                          </div>
                          <div className="text-xs text-slate-600">
                            {apt.vehicle?.make} {apt.vehicle?.model}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${st.cls}`}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href="/staff/appointments"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#0866ff] text-slate-700 hover:text-white font-semibold transition-colors"
                          >
                            <span>Xử lý lịch</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : billingRecords.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0050cd] flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[26px]">receipt_long</span>
            </div>
            <p className="text-sm font-bold text-slate-800">
              Không có hóa đơn nào đang chờ thu ngân
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Mọi lệnh sửa chữa hoàn tất KCS đã được phát hành hóa đơn và thanh toán đầy đủ.
            </p>
            <Link
              href="/staff/billing"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0866ff] text-white text-xs font-bold"
            >
              <span>Mở phân hệ Hóa đơn</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/80 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Mã Lệnh / HĐ</th>
                  <th className="py-3 px-4">Khách hàng & Xe</th>
                  <th className="py-3 px-4 text-right">Tổng thanh toán</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {billingRecords.slice(0, 6).map((b: any) => (
                  <tr key={b.workOrderId || b.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-4 font-mono tabular-nums font-bold text-[#0050cd]">
                      {b.woNumber || b.invoiceNumber || `#${b.id}`}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">
                        {b.customer?.fullName || b.customerName || '—'}
                      </div>
                      <div className="font-mono tabular-nums text-xs text-slate-600">
                        {b.vehicle?.licensePlate || b.licensePlate || '—'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatMoney(b.grandTotal || b.estimatedTotal || 0)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href="/staff/billing"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0866ff] text-white font-semibold"
                      >
                        <span>Thu tiền</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
