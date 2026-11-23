'use client';

import React, { useEffect, useState, useMemo, useDeferredValue, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchIntakeQueue,
  createIntakeRecord,
  arriveAppointment,
  cancelIntakeRecord,
} from '@/store/slices/intakeSlice';
import { fetchAppointments } from '@/store/slices/appointmentSlice';
import api from '@/lib/axios';
import TablePagination from '@/components/shared/TablePagination';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const WalkInIntakeModal = dynamic(() => import('@/components/intake/WalkInIntakeModal'), { ssr: false });
const TowInIntakeModal = dynamic(() => import('@/components/intake/TowInIntakeModal'), { ssr: false });
const WarrantyIntakeModal = dynamic(() => import('@/components/intake/WarrantyIntakeModal'), { ssr: false });
const IntakeDetailModal = dynamic(() => import('@/components/intake/IntakeDetailModal'), { ssr: false });
const ConfirmModal = dynamic(() => import('@/components/shared/ConfirmModal'), { ssr: false });
const ReadOnlyROModal = dynamic(() => import('@/components/intake/ReadOnlyROModal'), { ssr: false });

const getTypeStyles = (type: string) => {
  switch (type) {
    case 'WALK_IN':
      return 'bg-blue-50 text-[#0866ff] border border-blue-200/70';
    case 'TOW_IN':
      return 'bg-amber-50 text-amber-700 border border-amber-200/70';
    case 'APPOINTMENT':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200/70';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
};

const getTypeName = (type: string) => {
  switch (type) {
    case 'WALK_IN':
      return 'Khách vãng lai';
    case 'TOW_IN':
      return 'Xe cứu hộ';
    case 'APPOINTMENT':
      return 'Hẹn trước';
    default:
      return type;
  }
};

export default function IntakePage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  // State from Redux
  const { records: queueRecords, loading: queueLoading, error: queueError } = useAppSelector((state) => state.intake);
  const { appointments, loading: aptLoading, error: aptError } = useAppSelector((state) => state.appointments);

  // Local UI state
  const [isWalkInModalOpen, setWalkInModalOpen] = useState(false);
  const [isTowInModalOpen, setTowInModalOpen] = useState(false);
  const [isWarrantyModalOpen, setWarrantyModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'QUEUED' | 'CONVERTED' | 'CANCELLED'>('QUEUED');
  const [intakeTypeFilter, setIntakeTypeFilter] = useState<'ALL' | 'APPOINTMENT' | 'WALK_IN' | 'TOW_IN'>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [viewingROId, setViewingROId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceTemplates, setServiceTemplates] = useState<Array<{id: number, name: string}>>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const customerSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCustomerSearch = (query: string) => {
    if (customerSearchTimer.current) clearTimeout(customerSearchTimer.current);
    const q = query.trim();
    if (q.length < 2) return;
    customerSearchTimer.current = setTimeout(async () => {
      try {
        const res = await api.get('/api/customers', { params: { search: q, limit: 50 } });
        const fetched: any[] = res.data?.data || [];
        if (fetched.length > 0) {
          setCustomers((prev) => {
            const byId = new Map(prev.map((c) => [c.id, c]));
            for (const c of fetched) byId.set(c.id, c);
            return Array.from(byId.values());
          });
        }
      } catch (err) {
        console.error('Failed to search customers:', err);
      }
    }, 300);
  };
  
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  } | null>(null);
  const [cancelModal, setCancelModal] = useState<{
    id: number;
    reason: string;
    submitting: boolean;
  } | null>(null);

  const reloadIntakeData = () => {
    dispatch(fetchIntakeQueue({}));
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    dispatch(fetchAppointments({
      startDate: todayStr,
      endDate: todayStr,
      status: 'CONFIRMED',
      limit: 100
    }));
  };

  // Fetch data on mount
  useEffect(() => {
    reloadIntakeData();

    // Fetch service templates
    api.get('/api/services', { params: { isActive: 'true' } })
      .then((res) => {
        const data = res.data;
        if (data && data.data) {
          setServiceTemplates(data.data);
        } else if (Array.isArray(data)) {
          setServiceTemplates(data);
        }
      })
      .catch((err) => console.error('Failed to fetch services:', err));

    // Fetch customers for the comboboxes
    api.get('/api/customers', { params: { limit: 100 } })
      .then((res) => {
        if (res.data && res.data.data) {
          setCustomers(res.data.data);
        }
      })
      .catch(console.error);
  }, [dispatch]);

  // Handlers
  const handleArriveAppointment = (id: number) => {
    setConfirmAction({
      isOpen: true,
      title: 'Xác nhận tiếp nhận',
      message: 'Bạn có chắc chắn xe đã đến xưởng và bắt đầu tiếp nhận?',
      onConfirm: async () => {
        try {
          await dispatch(arriveAppointment(id)).unwrap();
          toast.success('Đã tiếp nhận xe thành công!');
          const n = new Date();
          const todayStr = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
          dispatch(fetchAppointments({ startDate: todayStr, endDate: todayStr, status: 'CONFIRMED' }));
          dispatch(fetchIntakeQueue({}));
        } catch (err: any) {
          toast.error(err || 'Có lỗi xảy ra');
        } finally {
          setConfirmAction(null);
        }
      }
    });
  };

  const handleWalkInSubmit = async (data: any) => {
    try {
      await dispatch(createIntakeRecord(data)).unwrap();
      setWalkInModalOpen(false);
      toast.success('Tạo phiếu tiếp nhận khách vãng lai thành công!');
      dispatch(fetchIntakeQueue({}));
    } catch (err: any) {
      toast.error(err || 'Có lỗi xảy ra');
    }
  };

  const handleTowInSubmit = async (data: any) => {
    try {
      await dispatch(createIntakeRecord(data)).unwrap();
      setTowInModalOpen(false);
      toast.success('Tạo phiếu tiếp nhận xe cứu hộ thành công!');
      dispatch(fetchIntakeQueue({}));
    } catch (err: any) {
      toast.error(err || 'Có lỗi xảy ra');
    }
  };

  const handleWarrantySubmit = async (data: any) => {
    try {
      await dispatch(createIntakeRecord(data)).unwrap();
      setWarrantyModalOpen(false);
      toast.success('Tiếp nhận xe bảo hành thành công!');
      dispatch(fetchIntakeQueue({}));
    } catch (err: any) {
      toast.error(err || 'Có lỗi xảy ra khi tiếp nhận xe bảo hành');
    }
  };

  const handleCancelIntake = (id: number) => {
    setCancelModal({ id, reason: '', submitting: false });
  };

  const handleConfirmCancelIntake = async () => {
    if (!cancelModal) return;
    setCancelModal((prev) => (prev ? { ...prev, submitting: true } : null));
    try {
      await dispatch(cancelIntakeRecord({ id: cancelModal.id, reason: cancelModal.reason })).unwrap();
      toast.success('Hủy phiếu thành công');
      setCancelModal(null);
      dispatch(fetchIntakeQueue({}));
    } catch (err: any) {
      toast.error(err || 'Có lỗi xảy ra khi hủy phiếu');
      setCancelModal((prev) => (prev ? { ...prev, submitting: false } : null));
    }
  };



  const deferredSearch = useDeferredValue(searchQuery);

  const { queuedCount, convertedCount, cancelledCount } = useMemo(() => {
    let queued = 0;
    let converted = 0;
    let cancelled = 0;
    for (const r of queueRecords) {
      if (r.status === 'QUEUED') queued += 1;
      else if (r.status === 'CONVERTED') converted += 1;
      else if (r.status === 'CANCELLED') cancelled += 1;
    }
    return { queuedCount: queued, convertedCount: converted, cancelledCount: cancelled };
  }, [queueRecords]);

  const { filteredTabCounts, filteredRecords, totalPages, paginatedRecords } = useMemo(() => {
    const rawSearch = deferredSearch.trim();
    const q = rawSearch.toLowerCase();
    const counts = { QUEUED: 0, CONVERTED: 0, CANCELLED: 0 };
    const matched: typeof queueRecords = [];

    for (const r of queueRecords) {
      const matchesSearch =
        !q ||
        r.vehicle?.license_plate?.toLowerCase().includes(q) ||
        r.customer?.full_name?.toLowerCase().includes(q) ||
        r.customer?.phone?.includes(rawSearch);
      const matchesType = intakeTypeFilter === 'ALL' || r.intake_type === intakeTypeFilter;
      if (!matchesSearch || !matchesType) continue;
      if (r.status === 'QUEUED' || r.status === 'CONVERTED' || r.status === 'CANCELLED') {
        counts[r.status] += 1;
      }
      if (r.status === activeTab) {
        matched.push(r);
      }
    }

    const pages = Math.max(1, Math.ceil(matched.length / itemsPerPage));
    const safePage = Math.min(currentPage, pages);
    const startIdx = (safePage - 1) * itemsPerPage;
    return {
      filteredTabCounts: counts,
      filteredRecords: matched,
      totalPages: pages,
      paginatedRecords: matched.slice(startIdx, startIdx + itemsPerPage),
    };
  }, [queueRecords, deferredSearch, intakeTypeFilter, activeTab, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6 w-full">
      {/* 1. Asymmetrical Bento Summary (5 + 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Hero Intake Card (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl saas-hero-gradient text-white p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 saas-subtle-grid pointer-events-none" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-blue-100/90">
                Tổng lượt tiếp nhận &amp; chờ đón
              </span>
              <div className="text-3xl font-mono font-extrabold tabular-nums tracking-tight mt-1">
                {queueRecords.length + appointments.length}{' '}
                <span className="text-sm font-sans font-medium text-blue-100/80">xe hôm nay</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-xs">
              <span className="material-symbols-outlined text-[22px] text-white">garage_home</span>
            </div>
          </div>

          <div className="relative z-10 mt-4 pt-3.5 border-t border-white/15 flex items-center justify-between text-xs text-blue-50">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-300 animate-pulse" />
              Lịch hẹn chờ tiếp nhận: <strong className="font-mono">{appointments.length}</strong>
            </span>
            <span className="font-mono font-semibold bg-white/15 px-2.5 py-0.5 rounded-full">
              {queuedCount} xe đang đợi lập lệnh
            </span>
          </div>
        </div>

        {/* 3 Queue Status Filter Tiles (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveTab('QUEUED');
              setCurrentPage(1);
            }}
            className={`text-left rounded-2xl p-4 border transition-all flex flex-col justify-between cursor-pointer ${
              activeTab === 'QUEUED'
                ? 'bg-blue-50/90 border-[#0866ff] shadow-sm'
                : 'bg-white border-slate-200/80 hover:border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Chờ xử lý</span>
              <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-[#0866ff] flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
              </div>
            </div>
            <div className="text-2xl font-mono font-extrabold tabular-nums text-slate-900 mt-2">
              {queuedCount}
            </div>
            <span className="text-[11px] text-[#0866ff] font-semibold mt-1">
              Đang chờ cố vấn kiểm tra
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('CONVERTED');
              setCurrentPage(1);
            }}
            className={`text-left rounded-2xl p-4 border transition-all flex flex-col justify-between cursor-pointer ${
              activeTab === 'CONVERTED'
                ? 'bg-emerald-50/90 border-emerald-400 shadow-sm'
                : 'bg-white border-slate-200/80 hover:border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Đã lập lệnh</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">task_alt</span>
              </div>
            </div>
            <div className="text-2xl font-mono font-extrabold tabular-nums text-slate-900 mt-2">
              {convertedCount}
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1">
              Đã tạo lệnh sửa chữa
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('CANCELLED');
              setCurrentPage(1);
            }}
            className={`text-left rounded-2xl p-4 border transition-all flex flex-col justify-between cursor-pointer ${
              activeTab === 'CANCELLED'
                ? 'bg-rose-50/90 border-rose-300 shadow-sm'
                : 'bg-white border-slate-200/80 hover:border-rose-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Đã hủy</span>
              <div className="w-8 h-8 rounded-lg bg-rose-100/80 text-rose-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">cancel</span>
              </div>
            </div>
            <div className="text-2xl font-mono font-extrabold tabular-nums text-slate-900 mt-2">
              {cancelledCount}
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1">
              Phiếu tiếp nhận đã hủy
            </span>
          </button>
        </div>
      </div>

      {(queueError || aptError) && (
        <div className="rounded-2xl bg-rose-50/90 border border-rose-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-rose-800">
            <span className="material-symbols-outlined text-[20px] text-rose-600 shrink-0">error</span>
            <span>Không thể đồng bộ dữ liệu tiếp nhận: {queueError || aptError}</span>
          </div>
          <button
            type="button"
            onClick={reloadIntakeData}
            className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* 3. LỊCH HẸN CHỜ TỚI HÔM NAY */}
      <div className="saas-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/60 text-[#0866ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">event_available</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Lịch hẹn chờ tới hôm nay</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-50 text-[#0866ff] border border-blue-200/70">
                  {appointments.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Danh sách xe đã xác nhận lịch hẹn trong ngày, nhấn &ldquo;Đánh dấu đã đến&rdquo; khi xe vào cổng.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[45vh] overflow-y-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
              <tr className="border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <th className="py-3 px-5">Giờ hẹn</th>
                <th className="py-3 px-5">Biển số xe</th>
                <th className="py-3 px-5">Khách hàng</th>
                <th className="py-3 px-5">Số điện thoại</th>
                <th className="py-3 px-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-sm">
              {aptLoading ? (
                <tr>
                  <td colSpan={5} className="text-center text-slate-500 py-10 text-xs">
                    Đang tải lịch hẹn hôm nay...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400 py-8 text-xs">
                    Không có lịch hẹn nào đang chờ check-in trong ngày hôm nay.
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#0866ff] font-mono text-xs font-bold border border-blue-200/60">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {apt.scheduled_time_str}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono text-xs font-bold tracking-wider">
                        {apt.vehicle?.license_plate || 'Chưa có BS'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-slate-800">
                      {apt.customer?.full_name || 'Khách vãng lai'}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs text-slate-600">
                      {apt.customer?.phone || 'Chưa cập nhật'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => handleArriveAppointment(apt.id)}
                        className="px-3.5 py-1.5 bg-blue-50 hover:bg-[#0866ff] text-[#0866ff] hover:text-white border border-blue-200/80 rounded-xl font-semibold text-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        <span>Đánh dấu đã đến</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. DANH SÁCH HÀNG ĐỢI TIẾP NHẬN */}
      <div className="saas-card overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 border-b border-slate-200/80 space-y-3">
          {/* Hàng 1: Tabs trạng thái + Nút thao tác tiếp nhận */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="overflow-x-auto no-scrollbar">
              {/* Segmented Pill Tabs */}
              <div className="inline-flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 shrink-0">
                {(['QUEUED', 'CONVERTED', 'CANCELLED'] as const).map((tab) => {
                  const count = filteredTabCounts[tab];

                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setCurrentPage(1);
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                        activeTab === tab
                          ? 'bg-white text-[#0866ff] shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>
                        {tab === 'QUEUED' && 'Chờ xử lý'}
                        {tab === 'CONVERTED' && 'Đã chuyển đổi'}
                        {tab === 'CANCELLED' && 'Đã hủy'}
                      </span>
                      <span
                        className={`font-mono text-[11px] px-1.5 py-0.2 rounded-full ${
                          activeTab === tab
                            ? 'bg-blue-50 text-[#0866ff] font-bold'
                            : 'bg-slate-200/80 text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
              <button
                onClick={() => setWarrantyModalOpen(true)}
                className="h-9 px-3.5 bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <span className="material-symbols-outlined text-[17px] text-emerald-600">
                  verified_user
                </span>
                <span>🛡️ Tiếp nhận bảo hành</span>
              </button>
              <button
                onClick={() => setTowInModalOpen(true)}
                className="h-9 px-3.5 bg-amber-50/90 hover:bg-amber-100/90 text-amber-800 border border-amber-200/90 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <span className="material-symbols-outlined text-[17px] text-amber-600">
                  local_shipping
                </span>
                <span>Tiếp nhận xe cứu hộ</span>
              </button>
              <button
                onClick={() => setWalkInModalOpen(true)}
                className="h-9 px-3.5 bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:brightness-110 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#0866ff]/20 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <span className="material-symbols-outlined text-[17px]">directions_walk</span>
                <span>+ Tiếp nhận khách vãng lai</span>
              </button>
            </div>
          </div>

          {/* Hàng 2: Tìm kiếm & Lọc loại tiếp nhận */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1 sm:max-w-sm">
              <span className="material-symbols-outlined text-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>
              <input
                type="text"
                placeholder="Tìm biển số, khách hàng, SĐT..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 pl-9 pr-4 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#0866ff] focus:ring-2 focus:ring-[#0866ff]/15 outline-none transition-all"
              />
            </div>

            <select
              aria-label="Lọc theo loại tiếp nhận"
              value={intakeTypeFilter}
              onChange={(e) => {
                setIntakeTypeFilter(e.target.value as 'ALL' | 'APPOINTMENT' | 'WALK_IN' | 'TOW_IN');
                setCurrentPage(1);
              }}
              className="h-9 px-3 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:border-[#0866ff] focus:ring-2 focus:ring-[#0866ff]/15 outline-none transition-all cursor-pointer sm:w-52"
            >
              <option value="ALL">Tất cả loại tiếp nhận</option>
              <option value="APPOINTMENT">Hẹn trước</option>
              <option value="WALK_IN">Khách vãng lai</option>
              <option value="TOW_IN">Xe cứu hộ</option>
            </select>
          </div>
        </div>

        {queueLoading ? (
          <div className="overflow-x-auto" aria-busy="true" aria-label="Đang tải danh sách tiếp nhận">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/95">
                <tr className="border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="py-3.5 px-3.5 lg:px-5">Phân loại &amp; Giờ vào</th>
                  <th className="py-3.5 px-3.5 lg:px-5">Biển số &amp; Dòng xe</th>
                  <th className="py-3.5 px-3.5 lg:px-5">Khách hàng</th>
                  <th className="py-3.5 px-3.5 lg:px-5">Dịch vụ yêu cầu</th>
                  <th className="py-3.5 px-3.5 lg:px-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-3.5 lg:px-5"><div className="h-5 w-24 bg-slate-200 rounded-full" /></td>
                    <td className="py-3.5 px-3.5 lg:px-5"><div className="h-6 w-28 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-3.5 lg:px-5"><div className="h-4 w-32 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-3.5 lg:px-5"><div className="h-5 w-40 bg-slate-100 rounded-lg" /></td>
                    <td className="py-3.5 px-3.5 lg:px-5 text-right"><div className="h-8 w-20 bg-slate-200 rounded-xl ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <span className="material-symbols-outlined text-[36px] text-slate-300">inbox</span>
              <p className="text-xs font-semibold text-slate-600">
                {searchQuery || intakeTypeFilter !== 'ALL'
                  ? 'Không tìm thấy kết quả phù hợp.'
                  : 'Danh sách tiếp nhận trống.'}
              </p>
              {searchQuery || intakeTypeFilter !== 'ALL' ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIntakeTypeFilter('ALL');
                    setCurrentPage(1);
                  }}
                  className="text-xs font-bold text-[#0866ff] hover:underline cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              ) : activeTab === 'QUEUED' ? (
                <button
                  type="button"
                  onClick={() => setWalkInModalOpen(true)}
                  className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0866ff] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Tiếp nhận khách vãng lai</span>
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop & Tablet Table (>= md) */}
            <div className="hidden md:block overflow-x-auto max-h-[60vh] overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                  <tr className="border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="py-3.5 px-3.5 lg:px-5 whitespace-nowrap">Phân loại &amp; Giờ vào</th>
                    <th className="py-3.5 px-3.5 lg:px-5 whitespace-nowrap">Biển số &amp; Dòng xe</th>
                    <th className="py-3.5 px-3.5 lg:px-5 whitespace-nowrap">Khách hàng</th>
                    <th className="py-3.5 px-3.5 lg:px-5">Dịch vụ yêu cầu</th>
                    <th className="py-3.5 px-3.5 lg:px-5 text-right whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 text-sm">
                  {paginatedRecords.map((record) => {
                    return (
                      <tr key={record.id} className="hover:bg-blue-50/25 transition-colors">
                        <td className="py-3.5 px-3.5 lg:px-5 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`w-fit px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${getTypeStyles(
                                record.intake_type
                              )}`}
                            >
                              {getTypeName(record.intake_type)}
                            </span>
                            <span className="text-xs font-mono text-slate-500">
                              {new Date(record.arrived_at).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5 lg:px-5 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <span className="w-fit px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-xs font-bold tracking-wider whitespace-nowrap">
                              {record.vehicle.license_plate}
                            </span>
                            <span className="text-xs text-slate-500">
                              {record.vehicle.make} {record.vehicle.model}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5 lg:px-5">
                          <div className="flex flex-col min-w-[120px]">
                            <span className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                              {record.customer.full_name}
                            </span>
                            <span className="text-xs font-mono text-slate-500 whitespace-nowrap">
                              {record.customer.phone || 'Chưa cập nhật'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5 lg:px-5">
                          {record.services && record.services.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {record.services.map((s) => (
                                <span
                                  key={s.id}
                                  className="bg-blue-50/60 text-slate-700 text-xs px-2.5 py-0.5 rounded-lg border border-blue-200/60 whitespace-nowrap"
                                >
                                  {s.service?.name || 'Dịch vụ'}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Chưa chọn dịch vụ</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3.5 lg:px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2 shrink-0">
                            <button
                              onClick={() => setSelectedRecord(record)}
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-[#0866ff] transition-colors border border-slate-200/80 cursor-pointer"
                              title="Xem chi tiết"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                visibility
                              </span>
                            </button>
                            {activeTab === 'QUEUED' && (
                              <button
                                onClick={() => handleCancelIntake(record.id)}
                                className="px-3 py-1.5 bg-rose-50/80 border border-rose-200/80 text-rose-600 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
                              >
                                Hủy
                              </button>
                            )}
                            {activeTab === 'CONVERTED' && record.work_order && (
                              <button
                                onClick={() => setViewingROId(record.work_order?.id || null)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#0866ff] text-white hover:bg-[#0050cd] transition-colors shadow-xs cursor-pointer"
                                title="Xem Lệnh sửa chữa"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  receipt_long
                                </span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List (< md) */}
            <div className="md:hidden divide-y divide-slate-200/70">
              {paginatedRecords.map((record) => {
              const typeLabel =
                record.intake_type === 'WALK_IN'
                  ? 'Khách vãng lai'
                  : record.intake_type === 'TOW_IN'
                    ? 'Xe cứu hộ'
                    : record.intake_type === 'APPOINTMENT'
                      ? 'Hẹn trước'
                      : record.intake_type;
              const typeBadge =
                record.intake_type === 'WALK_IN'
                  ? 'bg-blue-50 text-[#0866ff] border border-blue-200/70'
                  : record.intake_type === 'TOW_IN'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200/70'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200/70';

              return (
                <div key={record.id} className="p-4 space-y-2.5 bg-white">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${typeBadge}`}>
                        {typeLabel}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        {new Date(record.arrived_at).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-xs font-bold tracking-wider whitespace-nowrap">
                      {record.vehicle.license_plate}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{record.customer.full_name}</p>
                      <p className="text-xs text-slate-500 font-mono">
                        {record.customer.phone || 'Chưa cập nhật'} • {record.vehicle.make} {record.vehicle.model}
                      </p>
                    </div>
                  </div>

                  {record.services && record.services.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {record.services.map((s) => (
                        <span
                          key={s.id}
                          className="bg-blue-50/60 text-slate-700 text-[11px] px-2 py-0.5 rounded-md border border-blue-200/60"
                        >
                          {s.service?.name || 'Dịch vụ'}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setSelectedRecord(record)}
                      className="h-8 px-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#0866ff] border border-slate-200/80 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">visibility</span>
                      Chi tiết
                    </button>
                    {activeTab === 'QUEUED' && (
                      <button
                        onClick={() => handleCancelIntake(record.id)}
                        className="h-8 px-3 bg-rose-50/80 border border-rose-200/80 text-rose-600 rounded-xl text-xs font-semibold hover:bg-rose-100 cursor-pointer"
                      >
                        Hủy
                      </button>
                    )}
                    {activeTab === 'CONVERTED' && record.work_order && (
                      <button
                        onClick={() => setViewingROId(record.work_order?.id || null)}
                        className="h-8 px-3 rounded-xl bg-[#0866ff] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">receipt_long</span>
                        Xem RO
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </>
        )}

        {/* Pagination Controls */}
        {filteredRecords.length > 0 && (
          <TablePagination
            totalRecords={filteredRecords.length}
            totalPages={totalPages}
            currentPage={Math.min(currentPage, totalPages)}
            onPageChange={setCurrentPage}
            currentCount={paginatedRecords.length}
            recordLabel="phiếu tiếp nhận"
            pageSize={itemsPerPage}
            pageSizeOptions={[10, 20, 50]}
            onPageSizeChange={(size) => {
              setItemsPerPage(size);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {/* Modals */}
      {isWalkInModalOpen && (
        <WalkInIntakeModal
          isOpen={isWalkInModalOpen}
          onClose={() => setWalkInModalOpen(false)}
          onSubmit={handleWalkInSubmit}
          services={serviceTemplates}
          customers={customers}
          onCustomerSearch={handleCustomerSearch}
          onVehicleAdded={(customerId, vehicle) => {
            setCustomers((prev) =>
              prev.map((c) =>
                Number(c.id) === customerId ? { ...c, vehicles: [...(c.vehicles || []), vehicle] } : c
              )
            );
          }}
        />
      )}
      {isTowInModalOpen && (
        <TowInIntakeModal
          isOpen={isTowInModalOpen}
          onClose={() => setTowInModalOpen(false)}
          onSubmit={handleTowInSubmit}
          services={serviceTemplates}
          customers={customers}
          onCustomerSearch={handleCustomerSearch}
          onVehicleAdded={(customerId, vehicle) => {
            setCustomers((prev) =>
              prev.map((c) =>
                Number(c.id) === customerId ? { ...c, vehicles: [...(c.vehicles || []), vehicle] } : c
              )
            );
          }}
        />
      )}
      {isWarrantyModalOpen && (
        <WarrantyIntakeModal
          isOpen={isWarrantyModalOpen}
          onClose={() => setWarrantyModalOpen(false)}
          onSubmit={handleWarrantySubmit}
          customers={customers}
        />
      )}
      {confirmAction?.isOpen && (
        <ConfirmModal
          isOpen={confirmAction.isOpen}
          title={confirmAction.title || ''}
          message={confirmAction.message || ''}
          isDestructive={confirmAction.isDestructive}
          onConfirm={confirmAction.onConfirm || (() => {})}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {selectedRecord && (
        <IntakeDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}

      {/* CANCEL INTAKE REASON MODAL */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50/50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-600 text-[20px]">cancel</span>
                Hủy phiếu tiếp nhận
              </h3>
              <button
                type="button"
                onClick={() => setCancelModal(null)}
                disabled={cancelModal.submitting}
                className="w-8 h-8 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-600">
                Bạn có chắc chắn muốn hủy phiếu tiếp nhận này? Vui lòng nhập lý do hủy (nếu có) để lưu lại trong hồ sơ.
              </p>
              <textarea
                rows={3}
                value={cancelModal.reason}
                onChange={(e) =>
                  setCancelModal((prev) => (prev ? { ...prev, reason: e.target.value } : null))
                }
                placeholder="Nhập lý do hủy phiếu (VD: Khách đổi ý, chờ quá lâu, đặt nhầm lịch...)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400"
              />
            </div>
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelModal(null)}
                disabled={cancelModal.submitting}
                className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelIntake}
                disabled={cancelModal.submitting}
                className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors disabled:opacity-60 cursor-pointer"
              >
                {cancelModal.submitting ? 'Đang hủy...' : 'Xác nhận hủy phiếu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* READ-ONLY WO MODAL */}
      {viewingROId && (
        <ReadOnlyROModal workOrderId={viewingROId} onClose={() => setViewingROId(null)} />
      )}
    </div>
  );
}
