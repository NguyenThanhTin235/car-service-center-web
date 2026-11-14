'use client';

import React, { useEffect, useState, useMemo, useDeferredValue } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchIntakeQueue,
  createIntakeRecord,
  arriveAppointment,
  cancelIntakeRecord,
} from '@/store/slices/intakeSlice';
import { fetchAppointments } from '@/store/slices/appointmentSlice';
import api from '@/lib/axios';
import WalkInIntakeModal from '@/components/intake/WalkInIntakeModal';
import TowInIntakeModal from '@/components/intake/TowInIntakeModal';
import IntakeDetailModal from '@/components/intake/IntakeDetailModal';
import ConfirmModal from '@/components/shared/ConfirmModal';
import TablePagination from '@/components/shared/TablePagination';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import ReadOnlyROModal from '@/components/intake/ReadOnlyROModal';

export default function IntakePage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  // State from Redux
  const { records: queueRecords, loading: queueLoading } = useAppSelector((state) => state.intake);
  const { appointments, loading: aptLoading } = useAppSelector((state) => state.appointments);

  // Local UI state
  const [isWalkInModalOpen, setWalkInModalOpen] = useState(false);
  const [isTowInModalOpen, setTowInModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'QUEUED' | 'CONVERTED' | 'CANCELLED'>('QUEUED');
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [viewingROId, setViewingROId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceTemplates, setServiceTemplates] = useState<Array<{id: number, name: string}>>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  } | null>(null);

  // Fetch data on mount
  useEffect(() => {
    // Lấy danh sách tiếp nhận (tất cả trạng thái)
    dispatch(fetchIntakeQueue({}));
    
    // Lấy lịch hẹn trong ngày hôm nay có trạng thái CONFIRMED
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    dispatch(fetchAppointments({ 
      startDate: todayStr, 
      endDate: todayStr,
      status: 'CONFIRMED',
      limit: 100 
    }));

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

  const handleCancelIntake = (id: number) => {
    setConfirmAction({
      isOpen: true,
      title: 'Hủy phiếu tiếp nhận',
      message: 'Bạn có chắc chắn muốn hủy phiếu tiếp nhận này?',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await dispatch(cancelIntakeRecord(id)).unwrap();
          toast.success('Hủy phiếu thành công');
          dispatch(fetchIntakeQueue({}));
        } catch (err: any) {
          toast.error(err || 'Có lỗi xảy ra khi hủy phiếu');
        } finally {
          setConfirmAction(null);
        }
      }
    });
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
      if (!matchesSearch) continue;
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
  }, [queueRecords, deferredSearch, activeTab, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6 w-full">
      {/* 1. SaaS Page Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
          Tiếp nhận xe vào xưởng
        </h1>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setTowInModalOpen(true)}
            className="h-10 px-4 bg-amber-50/90 hover:bg-amber-100/90 text-amber-800 border border-amber-200/90 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-amber-600">
              local_shipping
            </span>
            <span>Tiếp nhận xe cứu hộ</span>
          </button>
          <button
            onClick={() => setWalkInModalOpen(true)}
            className="h-10 px-4 bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:brightness-110 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-[#0866ff]/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">directions_walk</span>
            <span>+ Tiếp nhận khách vãng lai</span>
          </button>
        </div>
      </div>

      {/* 2. Asymmetrical Bento Summary (5 + 7 cols) */}
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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/60 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
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
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Segmented Pill Tabs */}
            <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/70">
              {(['QUEUED', 'CONVERTED', 'CANCELLED'] as const).map((tab) => {
                const count = filteredTabCounts[tab];

                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setCurrentPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === tab
                        ? 'bg-white text-[#0866ff] shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>
                      {tab === 'QUEUED' && 'Chờ xử lý'}
                      {tab === 'CONVERTED' && 'Đã chuyển RO'}
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

          <div className="relative max-w-sm w-full">
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
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/60 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <th className="py-3.5 px-5"> Phân loại &amp; Giờ vào</th>
                <th className="py-3.5 px-5">Biển số &amp; Dòng xe</th>
                <th className="py-3.5 px-5">Khách hàng</th>
                <th className="py-3.5 px-5">Dịch vụ yêu cầu</th>
                <th className="py-3.5 px-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-sm">
              {queueLoading ? (
                <tr>
                  <td colSpan={5} className="text-center text-slate-500 py-12 text-xs">
                    Đang tải danh sách tiếp nhận...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400 py-12 text-xs">
                    {searchQuery ? 'Không tìm thấy kết quả phù hợp.' : 'Danh sách tiếp nhận trống.'}
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((record) => {
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

                    return (
                      <tr key={record.id} className="hover:bg-blue-50/25 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`w-fit px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getTypeStyles(
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
                        <td className="py-3.5 px-5">
                          <div className="flex flex-col gap-0.5">
                            <span className="w-fit px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-xs font-bold tracking-wider">
                              {record.vehicle.license_plate}
                            </span>
                            <span className="text-xs text-slate-500">
                              {record.vehicle.make} {record.vehicle.model}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-900">
                              {record.customer.full_name}
                            </span>
                            <span className="text-xs font-mono text-slate-500">
                              {record.customer.phone || 'Chưa cập nhật'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
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
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
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
                  })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredRecords.length > 0 && (
          <TablePagination
            totalRecords={filteredRecords.length}
            totalPages={totalPages}
            currentPage={Math.min(currentPage, totalPages)}
            onPageChange={setCurrentPage}
            currentCount={paginatedRecords.length}
            recordLabel="phiếu tiếp nhận"
          />
        )}
      </div>

      {/* Modals */}
      <WalkInIntakeModal
        isOpen={isWalkInModalOpen}
        onClose={() => setWalkInModalOpen(false)}
        onSubmit={handleWalkInSubmit}
        services={serviceTemplates}
        customers={customers}
      />
      <TowInIntakeModal
        isOpen={isTowInModalOpen}
        onClose={() => setTowInModalOpen(false)}
        onSubmit={handleTowInSubmit}
        services={serviceTemplates}
        customers={customers}
      />
      <ConfirmModal
        isOpen={confirmAction?.isOpen || false}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        isDestructive={confirmAction?.isDestructive}
        onConfirm={confirmAction?.onConfirm || (() => {})}
        onCancel={() => setConfirmAction(null)}
      />
      {selectedRecord && (
        <IntakeDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}

      {/* READ-ONLY WO MODAL */}
      {viewingROId && (
        <ReadOnlyROModal workOrderId={viewingROId} onClose={() => setViewingROId(null)} />
      )}
    </div>
  );
}
