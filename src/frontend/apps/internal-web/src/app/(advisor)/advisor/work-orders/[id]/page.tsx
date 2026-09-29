'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import WOSubHeader from '@/components/advisor/work-order/WOSubHeader';
import WOBadgeBar from '@/components/advisor/work-order/WOBadgeBar';
import WOOverviewCards from '@/components/advisor/work-order/WOOverviewCards';
import WOStatusControl from '@/components/advisor/work-order/WOStatusControl';
import WOVehicleCustomerInfo from '@/components/advisor/work-order/WOVehicleCustomerInfo';
import WOTabContainer from '@/components/advisor/work-order/WOTabContainer';
import ChatterSidebar from '@/components/advisor/work-order/ChatterSidebar';
import { getWorkOrderById, getWorkOrders, WorkOrder } from '@/lib/api/work-order.api';
import toast from 'react-hot-toast';

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Navigation state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [prevId, setPrevId] = useState<number | null>(null);
  const [nextId, setNextId] = useState<number | null>(null);

  const fetchWO = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      // Fetch current WO
      const res = await getWorkOrderById(id);
      if (res.success && res.data) {
        setWorkOrder(res.data);
      } else {
        toast.error(res.message || 'Không tìm thấy phiếu công việc');
        router.push('/advisor/intake-queue');
        return;
      }

      // Fetch all WOs to determine index and prev/next
      const listRes = await getWorkOrders({ limit: 100 });
      if (listRes.success && listRes.data) {
        const list = listRes.data;
        setTotalCount(list.length);
        const idx = list.findIndex(wo => wo.id === id);
        if (idx !== -1) {
          setCurrentIndex(idx + 1); // 1-based index
          setPrevId(idx > 0 ? list[idx - 1].id : null);
          setNextId(idx < list.length - 1 ? list[idx + 1].id : null);
        }
      }
    } catch (err: any) {
      toast.error('Lỗi khi tải phiếu công việc');
      router.push('/advisor/intake-queue');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchWO();
  }, [fetchWO]);

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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <span className="material-symbols-outlined animate-spin text-[40px] text-primary">progress_activity</span>
      </div>
    );
  }

  if (!workOrder) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden bg-surface">
      {/* Sub Header (Fixed) */}
      <WOSubHeader 
        woNumber={workOrder.wo_number} 
        currentIndex={currentIndex}
        totalCount={totalCount}
        onNext={() => nextId && router.push(`/advisor/work-orders/${nextId}`)}
        onPrev={() => prevId && router.push(`/advisor/work-orders/${prevId}`)}
      />
      
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
        <div className={`h-full overflow-y-auto p-6 styled-scrollbar pb-32 transition-all duration-300 ${isSidebarOpen ? 'w-3/4' : 'w-full'}`}>
          {/* Overview Section */}
          <div className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Tổng quan</div>
          <WOOverviewCards data={dummyOverview} />

          {/* Status Control */}
          <WOStatusControl claimStatus="Đã phê duyệt" holdReason="Chờ phụ tùng" />

          {/* Vehicle & Customer Profiles */}
          <WOVehicleCustomerInfo 
            vehicle={{ vin: 'N/A', color: workOrder.vehicle?.color || 'N/A', class: workOrder.vehicle?.vehicle_size || 'N/A', classDesc: '' }} 
            customer={dummyCustomer} 
            workOrderInfo={{
              type: 'Sửa chữa Gầm/Điện & Đồng sơn',
              advisor: workOrder.advisor?.full_name || 'Mike',
              planDate: '15 Thg 6 2026 → 20 Thg 6 2026'
            }}
          />

          {/* 8 Tabs */}
          <WOTabContainer workOrder={workOrder} refetchWO={fetchWO} />
        </div>

        {/* Toggle Button */}
        <div 
          className={`absolute top-1/2 -translate-y-1/2 z-20 transition-all duration-300 ${isSidebarOpen ? 'right-[25%]' : 'right-0'}`}
        >
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center justify-center w-8 h-10 bg-surface-container-lowest border-y border-l border-outline-variant shadow-[-2px_0_5px_rgba(0,0,0,0.05)] rounded-l-lg hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
              {isSidebarOpen ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        {/* Chatter Sidebar - Dynamic Width */}
        <div className={`h-full z-10 transition-all duration-300 bg-surface-container-lowest overflow-hidden ${isSidebarOpen ? 'w-1/4 border-l border-outline-variant opacity-100' : 'w-0 opacity-0 border-l-0'}`}>
          <div className="w-[25vw] h-full">
            <ChatterSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
