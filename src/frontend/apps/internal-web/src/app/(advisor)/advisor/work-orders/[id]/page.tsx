'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import WOTabContainer from '@/components/advisor/work-order/WOTabContainer';
import ChevronPipeline from '@/components/advisor/work-order/ChevronPipeline';
import EditVehicleModal from '@/components/advisor/work-order/modals/EditVehicleModal';
import EditCustomerModal from '@/components/advisor/work-order/modals/EditCustomerModal';
import { getWorkOrderById, getWorkOrders, WorkOrder } from '@/lib/api/work-order.api';
import { getWOQuotations } from '@/lib/api/quotation.api';
import toast from 'react-hot-toast';

const STATUS_PIPELINE = [
  'Tiếp nhận',
  'Lập kế hoạch',
  'Chờ duyệt',
  'Đã duyệt',
  'Đang sửa',
  'Chờ thanh toán',
  'Chờ giao xe',
  'Đóng',
];

const STATUS_MAP: Record<string, string> = {
  DRAFT: 'Tiếp nhận',
  IN_PLANNING: 'Lập kế hoạch',
  PENDING_APPROVAL: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  IN_PROGRESS: 'Đang sửa',
  BILLING_REQUESTED: 'Chờ thanh toán',
  FINANCIAL_CLEARED: 'Chờ giao xe',
  RELEASED: 'Đóng',
  CLOSED: 'Đóng',
  CANCELLED: 'Đã hủy',
};

const WO_STATUS_BADGE: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  DRAFT: { label: 'Tiếp nhận', bg: 'bg-slate-200', text: 'text-slate-800', dot: 'bg-slate-600' },
  IN_PLANNING: { label: 'Lập kế hoạch', bg: 'bg-blue-50', text: 'text-[#0050cd]', dot: 'bg-[#0050cd]' },
  PENDING_APPROVAL: { label: 'Chờ duyệt báo giá', bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500' },
  APPROVED: { label: 'Đã duyệt báo giá', bg: 'bg-indigo-50', text: 'text-indigo-800', dot: 'bg-indigo-600' },
  IN_PROGRESS: { label: 'Đang sửa chữa', bg: 'bg-blue-50', text: 'text-[#0050cd]', dot: 'bg-[#0050cd]' },
  BILLING_REQUESTED: { label: 'Chờ thanh toán', bg: 'bg-purple-50', text: 'text-purple-800', dot: 'bg-purple-600' },
  FINANCIAL_CLEARED: { label: 'Chờ giao xe', bg: 'bg-teal-50', text: 'text-teal-800', dot: 'bg-teal-600' },
  RELEASED: { label: 'Đã giao xe', bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-600' },
  CLOSED: { label: 'Đã đóng hồ sơ', bg: 'bg-emerald-100', text: 'text-emerald-900', dot: 'bg-emerald-700' },
  CANCELLED: { label: 'Đã hủy', bg: 'bg-rose-50', text: 'text-rose-800', dot: 'bg-rose-600' },
};

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoStats, setQuoStats] = useState({ quotes: 0, total: 0, approved: 0, pending: 0 });
  const [editVehicleOpen, setEditVehicleOpen] = useState(false);
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);

  // Navigation state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [prevId, setPrevId] = useState<number | null>(null);
  const [nextId, setNextId] = useState<number | null>(null);

  const initialLoadDone = useRef(false);

  const fetchWO = useCallback(async () => {
    if (!id) return;
    try {
      if (!initialLoadDone.current) {
        setLoading(true);
      }
      const res = await getWorkOrderById(id);
      if (res.success && res.data) {
        setWorkOrder(res.data);
        initialLoadDone.current = true;
      } else {
        toast.error(res.message || 'Không tìm thấy phiếu công việc');
        router.push('/advisor/intake-queue');
        return;
      }

      // Fetch quotations stats
      const quoRes = await getWOQuotations(id).catch(() => null);
      if (quoRes && quoRes.success && quoRes.data) {
        let qTotal = 0;
        let qApproved = 0;
        let qPending = 0;
        quoRes.data.forEach((q) => {
          qTotal += q.grandTotal;
          if (q.status === 'APPROVED') qApproved += q.grandTotal;
          if (q.status === 'SENT' || q.status === 'DRAFT') qPending += q.grandTotal;
        });
        setQuoStats({
          quotes: quoRes.data.length,
          total: qTotal,
          approved: qApproved,
          pending: qPending,
        });
      }

      // Fetch all WOs to determine index and prev/next
      const listRes = await getWorkOrders({ limit: 100 }).catch(() => null);
      if (listRes && listRes.success && listRes.data) {
        const list = listRes.data;
        setTotalCount(list.length);
        const idx = list.findIndex((wo) => wo.id === id);
        if (idx !== -1) {
          setCurrentIndex(idx + 1);
          setPrevId(idx > 0 ? list[idx - 1].id : null);
          setNextId(idx < list.length - 1 ? list[idx + 1].id : null);
        }
      }
    } catch {
      toast.error('Lỗi khi tải phiếu công việc');
      router.push('/advisor/intake-queue');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchWO();
  }, [fetchWO]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-[40px] text-[#0050cd]">
          progress_activity
        </span>
      </div>
    );
  }

  if (!workOrder) return null;

  // Derived real metrics from workOrder & quoStats (100% real API fields)
  const servicesCount = workOrder.services?.length || 0;
  const jobsTotal =
    workOrder.services?.reduce((acc, s) => acc + (s.jobs?.length || 0), 0) || 0;
  const jobsCompleted =
    workOrder.services?.reduce(
      (acc, s) =>
        acc +
        (s.jobs?.filter((j) => j.status === 'COMPLETED' || j.status === 'PASSED').length || 0),
      0
    ) || 0;
  const jobsActive =
    workOrder.services?.reduce(
      (acc, s) =>
        acc +
        (s.jobs?.filter(
          (j) => j.status === 'IN_PROGRESS' || j.status === 'COMPLETED' || j.status === 'PASSED'
        ).length || 0),
      0
    ) || 0;
  const partsTotal =
    workOrder.services?.reduce(
      (acc, s) =>
        acc + (s.jobs?.reduce((jAcc, j) => jAcc + (j.parts?.length || 0), 0) || 0),
      0
    ) || 0;

  const progressPct = jobsTotal > 0 ? Math.round((jobsActive / jobsTotal) * 100) : 25;
  const remainingPct = 100 - progressPct;

  const statusInfo = WO_STATUS_BADGE[workOrder.status] || {
    label: workOrder.status,
    bg: 'bg-slate-200',
    text: 'text-slate-800',
    dot: 'bg-slate-500',
  };

  const displayQuotationValue =
    quoStats.approved > 0
      ? quoStats.approved
      : quoStats.total > 0
      ? quoStats.total
      : (workOrder.check_in as any)?.intake_cost_estimate || 0;

  const mappedStatus = STATUS_MAP[workOrder.status] || workOrder.status;

  return (
    <div className="flex flex-col gap-5 px-4 sm:px-6 py-3 max-w-[1440px] mx-auto w-full">
      {/* 1. TOP BREADCRUMB, STATUS PIPELINE & RECORD SWITCHER BAR (Sticky on Scroll) */}
      <div className="sticky top-16 z-20 py-1 bg-[#f2f4f8]/95 backdrop-blur-md -my-1">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white rounded-[24px] px-4 sm:px-5 py-2.5 sm:py-3 shadow-xs border border-slate-200/80">
          {/* Left: Back button + WO Number */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/advisor/work-orders"
              className="w-9 h-9 rounded-xl bg-[#f2f4f8] hover:bg-slate-200 text-zinc-800 flex items-center justify-center transition-colors shrink-0"
              title="Quay lại danh sách phiếu công việc"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </Link>

            <span className="font-mono font-extrabold text-zinc-900 tracking-tight text-sm sm:text-base">
              {workOrder.wo_number}
            </span>
          </div>

          {/* Center: Chevron Status Pipeline Stepper */}
          <div className="overflow-x-auto no-scrollbar py-0.5 max-w-full flex items-center justify-start lg:justify-center">
            <ChevronPipeline
              statuses={STATUS_PIPELINE}
              currentStatus={mappedStatus}
              compact={true}
            />
          </div>

          {/* Right: Prev / Next Work Order Switcher */}
          <div className="flex items-center justify-between lg:justify-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            {totalCount > 0 && (
              <span className="text-xs font-mono font-bold text-slate-500 px-2 tabular-nums">
                {currentIndex} / {totalCount}
              </span>
            )}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => prevId && router.push(`/advisor/work-orders/${prevId}`)}
                disabled={!prevId}
                title="Phiếu trước"
                className="w-9 h-9 rounded-xl bg-[#f2f4f8] hover:bg-slate-200 disabled:opacity-35 flex items-center justify-center text-zinc-800 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={() => nextId && router.push(`/advisor/work-orders/${nextId}`)}
                disabled={!nextId}
                title="Phiếu tiếp theo"
                className="w-9 h-9 rounded-xl bg-[#f2f4f8] hover:bg-slate-200 disabled:opacity-35 flex items-center justify-center text-zinc-800 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 4-CARD HIGH-CONTRAST HERO BENTO GRID (Separated Customer & Quotation Cards) */}
      <div
        data-testid="wo-detail-hero-grid"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* CARD 1: SOFT ICE BLUE (#edf4fe) & BLUE ACCENT — Vehicle & Work Order Identity */}
        <div className="bg-[#edf4fe] border border-blue-200/80 rounded-[28px] p-5 flex flex-col justify-between min-h-[190px] shadow-xs">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-[#0050cd] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[18px]">directions_car</span>
                </span>
                <span className="text-slate-700 font-bold text-xs truncate">Phương tiện</span>
              </div>
              <button
                type="button"
                onClick={() => setEditVehicleOpen(true)}
                className="w-7 h-7 rounded-lg bg-white border border-blue-200/80 hover:bg-blue-50 text-slate-600 hover:text-[#0050cd] flex items-center justify-center transition-colors shadow-2xs cursor-pointer shrink-0"
                title="Sửa đổi thông tin phương tiện"
                aria-label="Sửa đổi thông tin phương tiện"
              >
                <span className="material-symbols-outlined text-[15px]">edit</span>
              </button>
            </div>

            <div className="mt-2.5 flex items-baseline gap-2 flex-wrap">
              <span className="font-mono text-xl sm:text-2xl font-extrabold tracking-wider text-zinc-900">
                {workOrder.vehicle?.license_plate || 'N/A'}
              </span>
              <span className="text-xs font-bold text-[#0050cd] truncate">
                {[workOrder.vehicle?.make, workOrder.vehicle?.model].filter(Boolean).join(' ') ||
                  'Phương tiện'}
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-1">
              Phân khúc: <strong className="text-zinc-900">{workOrder.vehicle?.vehicle_size || 'N/A'}</strong>
              {workOrder.vehicle?.color ? ` • Màu: ${workOrder.vehicle.color}` : ''}
              {workOrder.vehicle?.year ? ` • Năm: ${workOrder.vehicle.year}` : ''}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-blue-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {new Date(workOrder.created_at).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span className="bg-white border border-blue-100 text-zinc-800 font-bold px-2 py-0.5 rounded-lg text-[11px]">
              CV: {workOrder.advisor?.full_name || 'Cố vấn DV'}
            </span>
          </div>
        </div>

        {/* CARD 2: VIBRANT ROYAL BLUE (#0050cd) — Technical Execution & Split Progress Bar */}
        <div className="bg-[#0050cd] text-white rounded-[28px] p-5 flex flex-col justify-between min-h-[190px] shadow-md shadow-[#0050cd]/20">
          <div>
            <div className="flex items-center justify-between text-blue-100 text-xs font-medium">
              <span>Tiến Độ Công Việc</span>
              <span className="material-symbols-outlined text-[18px]">engineering</span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums">
                {jobsCompleted}/{jobsTotal}
              </span>
              <span className="text-xs font-bold text-emerald-300 truncate">
                hoàn tất ({servicesCount} mục)
              </span>
            </div>
            <p className="text-xs text-blue-100/85 mt-0.5 truncate">
              Phụ tùng khai báo: <strong>{partsTotal}</strong> mã vật tư
            </p>
          </div>

          {/* 2-Tone Split Progress Bar Inside Dark Navy Inset Container */}
          <div className="mt-3">
            <div className="bg-[#0c2340] rounded-2xl p-1.5 flex items-stretch h-11 gap-1.5">
              <div
                style={{ width: `${Math.max(25, Math.min(75, progressPct))}%` }}
                className="bg-white text-zinc-900 rounded-xl px-2 flex items-center font-mono font-extrabold text-xs tabular-nums"
              >
                {progressPct}% chạy
              </div>
              <div className="flex-1 text-white px-2 flex items-center font-mono font-extrabold text-xs tabular-nums">
                {remainingPct}% chờ
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: SOFT COOL SLATE (#f4f6fa) — Customer Identity & Direct Action */}
        <div className="bg-[#f4f6fa] border border-slate-200/80 rounded-[28px] p-5 flex flex-col justify-between min-h-[190px] shadow-xs">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">person</span>
                </span>
                <span className="text-slate-700 font-bold text-xs truncate">Khách Hàng</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                  Chủ xe
                </span>
                <button
                  type="button"
                  onClick={() => setEditCustomerOpen(true)}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-[#0050cd] flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                  title="Sửa đổi thông tin khách hàng"
                  aria-label="Sửa đổi thông tin khách hàng"
                >
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                </button>
              </div>
            </div>

            <div className="mt-2.5">
              <div className="text-base sm:text-lg font-extrabold text-zinc-900 tracking-tight truncate">
                {workOrder.customer?.full_name || 'Khách vãng lai'}
              </div>
              <div className="mt-1 flex flex-col gap-0.5 text-xs text-slate-600">
                <span className="font-mono font-semibold text-zinc-800">
                  {workOrder.customer?.phone || 'Chưa cập nhật SĐT'}
                </span>
                {workOrder.customer?.email && (
                  <span className="text-slate-500 truncate max-w-[200px]">
                    {workOrder.customer.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-500">Liên hệ</span>
            {workOrder.customer?.phone ? (
              <a
                href={`tel:${workOrder.customer.phone}`}
                className="bg-[#0c2340] hover:bg-[#07172c] text-white font-mono font-bold px-3 py-1.5 rounded-xl text-[11px] inline-flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <span className="material-symbols-outlined text-[14px]">call</span>
                Gọi khách
              </a>
            ) : (
              <span className="text-slate-400">Không có SĐT</span>
            )}
          </div>
        </div>

        {/* CARD 4: CLEAN WHITE CARD — Quotation & Billing Financial Summary */}
        <div className="bg-white border border-slate-200/80 rounded-[28px] p-5 flex flex-col justify-between min-h-[190px] shadow-xs">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">payments</span>
                </span>
                <span className="text-slate-700 font-bold text-xs truncate">Báo Giá & Chi Phí</span>
              </div>
              {quoStats.quotes > 0 && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg shrink-0">
                  {quoStats.quotes} bản
                </span>
              )}
            </div>

            <div className="mt-2.5">
              <div className="font-mono text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums text-zinc-900 truncate">
                {displayQuotationValue > 0
                  ? `${Number(displayQuotationValue).toLocaleString('vi-VN')} đ`
                  : 'Chưa báo giá'}
              </div>
              <p className="mt-1 text-xs text-slate-500 truncate">
                {quoStats.approved > 0
                  ? 'Khách đã duyệt báo giá'
                  : quoStats.total > 0
                  ? 'Đang chờ khách duyệt'
                  : 'Ước tính tiếp nhận ban đầu'}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-500">Hóa đơn</span>
            <span className="font-semibold text-zinc-800 text-[11px]">
              {workOrder.status === 'CLOSED'
                ? 'Đã quyết toán'
                : workOrder.status === 'BILLING_REQUESTED'
                ? 'Chờ xuất hóa đơn'
                : 'Tạm tính'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. FULL-WIDTH 6-TAB BENTO WORKSPACE CARD */}
      <div className="bg-white rounded-[28px] p-4 sm:p-6 shadow-xs border border-slate-200/70">
        <WOTabContainer workOrder={workOrder} refetchWO={fetchWO} />
      </div>

      {/* 4. MODALS FOR EDITING VEHICLE & CUSTOMER (Anytime Access) */}
      <EditVehicleModal
        isOpen={editVehicleOpen}
        onClose={() => setEditVehicleOpen(false)}
        vehicle={
          workOrder.vehicle
            ? {
                id: workOrder.vehicle.id,
                license_plate: workOrder.vehicle.license_plate,
                make: workOrder.vehicle.make,
                model: workOrder.vehicle.model,
                year: workOrder.vehicle.year,
                color: workOrder.vehicle.color,
                vehicle_size: workOrder.vehicle.vehicle_size,
              }
            : null
        }
        onSuccess={fetchWO}
      />

      <EditCustomerModal
        isOpen={editCustomerOpen}
        onClose={() => setEditCustomerOpen(false)}
        customer={
          workOrder.customer
            ? {
                id: workOrder.customer.id,
                full_name: workOrder.customer.full_name,
                phone: workOrder.customer.phone,
                email: workOrder.customer.email,
              }
            : null
        }
        onSuccess={fetchWO}
      />
    </div>
  );
}
