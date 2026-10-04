'use client';
import React, { useEffect, useState } from 'react';
import { getWorkOrderById, WorkOrder } from '@/lib/api/work-order.api';
import toast from 'react-hot-toast';
import WOBadgeBar from '@/components/advisor/work-order/WOBadgeBar';
import WOOverviewCards from '@/components/advisor/work-order/WOOverviewCards';
import WOStatusControl from '@/components/advisor/work-order/WOStatusControl';
import WOVehicleCustomerInfo from '@/components/advisor/work-order/WOVehicleCustomerInfo';
import WOTabContainer from '@/components/advisor/work-order/WOTabContainer';

interface StaffWorkOrderDetailModalProps {
  workOrderId: number;
  onClose: () => void;
}

export default function StaffWorkOrderDetailModal({ workOrderId, onClose }: StaffWorkOrderDetailModalProps) {
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workOrderId) return;
    
    const fetchWO = async () => {
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
    };
    
    fetchWO();
  }, [workOrderId, onClose]);

  const dummyOverview = {
    checkInTime: workOrder ? new Date(workOrder.created_at).toLocaleString('vi-VN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '...',
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
    memberType: 'Gold',
    memberId: 'M-04921',
    packageDesc: 'Premium 10k svc (3 visits left)'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-surface rounded-2xl w-[95vw] max-w-[1400px] shadow-2xl flex flex-col h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface-container-lowest shrink-0">
          <h2 className="text-title-lg font-bold text-on-surface">
            Chi tiết phiếu công việc {workOrder ? `- ${workOrder.wo_number}` : ''}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body (Reusing SA components) */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center bg-surface">
            <span className="material-symbols-outlined animate-spin text-[40px] text-primary">progress_activity</span>
          </div>
        ) : workOrder ? (
          <div className="flex flex-col flex-1 overflow-hidden relative bg-surface">
            
            {/* Badge Bar (Fixed) */}
            <WOBadgeBar 
              licensePlate={workOrder.vehicle?.license_plate || '...'}
              vehicleClass={workOrder.vehicle?.vehicle_size || 'N/A'}
              vehicleName={`${workOrder.vehicle?.make || ''} ${workOrder.vehicle?.model || ''}`}
              customerName={workOrder.customer?.full_name || '...'}
              statusBadge={workOrder.status}
            />

            {/* Main Content Area: Resizable via state */}
            <div className="flex flex-1 overflow-hidden relative">
              
              {/* Workspace - Dynamic Width, Scrollable */}
              <div className="h-full w-full overflow-y-auto p-6 styled-scrollbar pb-32 transition-all duration-300">
                {/* Overview Section */}
                <div className="mb-8">
                  <div className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Tổng quan</div>
                  <WOOverviewCards data={dummyOverview} />
                </div>

                {/* Status Control - Text Only for Staff */}
                <div className="flex flex-col gap-2 mb-8">
                  <div className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Trạng thái</div>
                  <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-wrap items-center gap-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-label-sm font-bold text-secondary">BẢO HIỂM / BẢO HÀNH</span>
                      <span className="text-body-md font-semibold text-on-surface">Đã phê duyệt</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-label-sm font-bold text-secondary">LÝ DO TẠM DỪNG / CHỜ</span>
                      <span className="text-body-md font-semibold text-on-surface">Chờ phụ tùng</span>
                    </div>
                    <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-tertiary-container text-on-tertiary-container rounded-lg">
                      <span className="material-symbols-outlined text-[18px]">pause_circle</span>
                      <span className="text-label-md font-bold">Đang tạm dừng</span>
                    </div>
                  </div>
                </div>

                {/* Vehicle & Customer Profiles */}
                <WOVehicleCustomerInfo 
                  isReadOnly={true}
                  vehicle={{ vin: 'N/A', color: workOrder.vehicle?.color || 'N/A', class: workOrder.vehicle?.vehicle_size || 'N/A', classDesc: '' }} 
                  customer={dummyCustomer} 
                  workOrderInfo={{
                    type: 'Sửa chữa Gầm/Điện & Đồng sơn',
                    advisor: workOrder.advisor?.full_name || 'Mike',
                    planDate: '15 Thg 6 2026 → 20 Thg 6 2026'
                  }}
                />

                {/* 8 Tabs */}
                <WOTabContainer isReadOnly={true} />
              </div>

            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
