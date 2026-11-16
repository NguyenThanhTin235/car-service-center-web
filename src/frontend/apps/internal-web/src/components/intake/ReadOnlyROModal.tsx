'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { getWorkOrderById, WorkOrder } from '@/lib/api/work-order.api';
import WOBadgeBar from '@/components/advisor/work-order/WOBadgeBar';
import WOOverviewCards from '@/components/advisor/work-order/WOOverviewCards';
import WOVehicleCustomerInfo from '@/components/advisor/work-order/WOVehicleCustomerInfo';
import WOTabContainer from '@/components/advisor/work-order/WOTabContainer';

type Props = {
  workOrderId: number;
  onClose: () => void;
};

export default function ReadOnlyROModal({ workOrderId, onClose }: Props) {
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWO = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getWorkOrderById(workOrderId);
      if (res.success && res.data) {
        setWorkOrder(res.data);
      } else {
        setError(res.message || 'Không tìm thấy phiếu công việc');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Lỗi khi tải chi tiết phiếu công việc');
    } finally {
      setLoading(false);
    }
  }, [workOrderId]);

  useEffect(() => {
    fetchWO();
  }, [fetchWO]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <div className="bg-surface p-8 rounded-2xl flex flex-col items-center gap-4 shadow-2xl border border-outline-variant/40">
          <span className="material-symbols-outlined animate-spin text-[40px] text-primary">progress_activity</span>
          <p className="text-on-surface-variant font-medium">Đang tải chi tiết phiếu công việc...</p>
        </div>
      </div>
    );
  }

  if (error || !workOrder) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <div
          data-testid="readonly-ro-error"
          className="bg-surface w-full max-w-md p-6 rounded-2xl shadow-2xl border border-outline-variant/40 flex flex-col items-center text-center gap-3"
        >
          <span className="material-symbols-outlined text-[40px] text-rose-500">error</span>
          <h3 className="text-base font-bold text-on-surface">Không thể tải phiếu công việc</h3>
          <p className="text-xs text-on-surface-variant">{error || 'Dữ liệu phiếu công việc không tồn tại.'}</p>
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={fetchWO}
              className="h-9 px-4 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Thử lại
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl border border-outline-variant text-on-surface text-xs font-bold hover:bg-surface-container transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  const woAny = workOrder as any;
  const allJobs = (workOrder.services || []).flatMap((s: any) => s.jobs || []);
  const jobsInProgress = allJobs.filter((j: any) => j.status === 'IN_PROGRESS').length;
  const jobsPending = allJobs.filter((j: any) => ['PLANNED', 'PENDING'].includes(j.status)).length;

  const allParts = allJobs.flatMap((j: any) => j.parts || []);
  const partsIn = allParts.filter((p: any) => ['ISSUED', 'INSTALLED', 'COMPLETED'].includes(p.status)).length;

  const quotations = Array.isArray(woAny.quotations) ? woAny.quotations : [];
  const quotationTotal = quotations.reduce((sum: number, q: any) => sum + Number(q.total_amount || 0), 0);
  const quotationApproved = quotations
    .filter((q: any) => q.status === 'APPROVED')
    .reduce((sum: number, q: any) => sum + Number(q.total_amount || 0), 0);
  const quotationPending = quotations
    .filter((q: any) => ['SENT', 'PENDING_APPROVAL', 'DRAFT'].includes(q.status))
    .reduce((sum: number, q: any) => sum + Number(q.total_amount || 0), 0);

  const invoices = (Array.isArray(woAny.invoices) ? woAny.invoices : []).filter(
    (inv: any) => inv.status !== 'CANCELLED'
  );
  const billingCollected = invoices
    .filter((inv: any) => inv.status === 'PAID')
    .reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0);

  const realOverview = {
    checkInTime: new Date(workOrder.created_at).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    bay: woAny.check_in?.mileage
      ? `ODO: ${Number(woAny.check_in.mileage).toLocaleString('vi-VN')} km`
      : 'Chưa ghi nhận ODO',
    jobsTotal: allJobs.length,
    jobsInProgress,
    jobsPending,
    partsTotal: allParts.length,
    partsIn,
    quotationTotal,
    quotationQuotes: quotations.length,
    quotationApproved,
    quotationPending,
    billingCollected,
    billingInvoices: invoices.length,
    billingInsurer: 0,
  };

  const customerInfo = {
    name: workOrder?.customer?.full_name || '...',
    phone: workOrder?.customer?.phone || '...',
    email: workOrder?.customer?.email || '...',
    memberType: 'Khách hàng xưởng',
    memberId: workOrder?.customer?.id ? `KH-${workOrder.customer.id}` : '-',
    packageDesc: '-',
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 lg:p-8 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-[1400px] h-full max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface-container-lowest shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[24px]">receipt_long</span>
            <h2 className="text-title-lg font-bold text-on-surface">
              Chi tiết Lệnh sửa chữa: <span className="font-mono text-primary">{workOrder.wo_number}</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold ml-2">Chỉ xem</span>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-highest text-on-surface-variant transition-colors group cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px] group-hover:text-error transition-colors">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 styled-scrollbar">
          <div className="flex flex-col gap-6">
            <WOBadgeBar 
              licensePlate={workOrder.vehicle?.license_plate || '...'}
              vehicleClass={workOrder.vehicle?.vehicle_size || 'N/A'}
              vehicleName={`${workOrder.vehicle?.make || ''} ${workOrder.vehicle?.model || ''}`}
              customerName={workOrder.customer?.full_name || '...'}
              statusBadge={workOrder.status}
            />

            <WOOverviewCards data={realOverview} />

            <WOVehicleCustomerInfo 
              isReadOnly={true}
              vehicle={{ vin: 'N/A', color: workOrder.vehicle?.color || 'N/A', class: workOrder.vehicle?.vehicle_size || 'N/A', classDesc: '' }} 
              customer={customerInfo} 
              workOrderInfo={{
                type: woAny.order_type === 'WARRANTY' ? 'Bảo hành' : 'Dịch vụ & Sửa chữa',
                advisor: workOrder.advisor?.full_name || 'Đang cập nhật',
                planDate: new Date(workOrder.created_at).toLocaleDateString('vi-VN'),
              }}
            />

            <WOTabContainer workOrder={workOrder} refetchWO={fetchWO} isReadOnly={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
