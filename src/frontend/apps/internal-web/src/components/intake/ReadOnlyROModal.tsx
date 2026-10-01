'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { getWorkOrderById, WorkOrder } from '@/lib/api/work-order.api';
import WOBadgeBar from '@/components/advisor/work-order/WOBadgeBar';
import WOOverviewCards from '@/components/advisor/work-order/WOOverviewCards';
import WOVehicleCustomerInfo from '@/components/advisor/work-order/WOVehicleCustomerInfo';
import WOTabContainer from '@/components/advisor/work-order/WOTabContainer';
import toast from 'react-hot-toast';

type Props = {
  workOrderId: number;
  onClose: () => void;
};

export default function ReadOnlyROModal({ workOrderId, onClose }: Props) {
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWO = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getWorkOrderById(workOrderId);
      if (res.success && res.data) {
        setWorkOrder(res.data);
      } else {
        toast.error(res.message || 'Không tìm thấy phiếu công việc');
        onClose();
      }
    } catch (err: any) {
      toast.error('Lỗi khi tải phiếu công việc');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [workOrderId, onClose]);

  useEffect(() => {
    fetchWO();
  }, [fetchWO]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-surface p-8 rounded-xl flex flex-col items-center gap-4 shadow-2xl">
          <span className="material-symbols-outlined animate-spin text-[40px] text-primary">progress_activity</span>
          <p className="text-on-surface-variant font-medium">Đang tải phiếu công việc...</p>
        </div>
      </div>
    );
  }

  if (!workOrder) return null;

  const dummyOverview = {
    checkInTime: new Date(workOrder.created_at).toLocaleString('vi-VN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
    bay: 'Bay 4',
    jobsTotal: 3,
    jobsInProgress: 2,
    jobsPending: 1,
    partsTotal: 3,
    partsIn: 3,
    quotationTotal: 2649.44,
    quotationQuotes: 4,
    quotationApproved: 1940.94,
    quotationPending: 708.50,
    billingCollected: 780.00,
    billingInvoices: 2,
    billingInsurer: 1660.94,
  };

  const dummyCustomer = {
    name: workOrder?.customer?.full_name || '...',
    phone: workOrder?.customer?.phone || '...',
    email: workOrder?.customer?.email || '...',
    memberType: 'Khách vãng lai',
    memberId: '-',
    packageDesc: '-'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 lg:p-8 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-[1400px] h-full max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface-container-lowest shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[24px]">receipt_long</span>
            <h2 className="text-title-lg font-bold text-on-surface">
              Chi tiết Phiếu Công Việc (RO): <span className="font-mono text-primary">{workOrder.wo_number}</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant text-label-sm font-semibold ml-2">Read-Only</span>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-highest text-on-surface-variant transition-colors group"
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

            <WOOverviewCards data={dummyOverview} />

            <WOVehicleCustomerInfo 
              vehicle={{ vin: 'N/A', color: workOrder.vehicle?.color || 'N/A', class: workOrder.vehicle?.vehicle_size || 'N/A', classDesc: '' }} 
              customer={dummyCustomer} 
              workOrderInfo={{
                type: 'Dịch vụ & Sửa chữa',
                advisor: workOrder.advisor?.full_name || 'Đang cập nhật',
                planDate: '...'
              }}
            />

            <WOTabContainer workOrder={workOrder} refetchWO={fetchWO} />
          </div>
        </div>
      </div>
    </div>
  );
}
