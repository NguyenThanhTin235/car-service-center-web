'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { IntakeQueueItem, createWorkOrder } from '@/lib/api/work-order.api';
import { formatVehicleSize } from '@/components/advisor/work-order/work-order.constants';
import {
  calcWaitTime,
  getIntakeTypeBadge,
  getEffectiveServices,
} from './IntakeDetailModal';
import toast from 'react-hot-toast';

const IntakeDetailModal = dynamic(() => import('./IntakeDetailModal'), { ssr: false });

function getServiceCategoryBadges(
  item: IntakeQueueItem
): Array<{ category: string; serviceNames: string[] }> {
  const effectiveServices = getEffectiveServices(item);
  if (effectiveServices.length === 0) return [];

  const categoryMap = new Map<string, string[]>();
  effectiveServices.forEach((s) => {
    const cat = s.category || 'Dịch vụ khác';
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push(s.name);
  });

  return Array.from(categoryMap.entries()).map(([category, serviceNames]) => ({
    category,
    serviceNames,
  }));
}

interface IntakeQueueTableProps {
  items: IntakeQueueItem[];
  onWorkOrderCreated: () => void;
}

export default function IntakeQueueTable({ items, onWorkOrderCreated }: IntakeQueueTableProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [selectedIntake, setSelectedIntake] = useState<IntakeQueueItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [items]);

  const handleCreateWorkOrder = async (intakeId: number) => {
    setLoadingId(intakeId);
    try {
      const response = await createWorkOrder(intakeId);
      if (response.success) {
        toast.success(`Tạo phiếu ${response.data.wo_number} thành công!`);
        onWorkOrderCreated();
        setSelectedIntake(null);
        router.push(`/advisor/work-orders/${response.data.id}`);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Lỗi khi tạo phiếu công việc';
      toast.error(message);
    } finally {
      setLoadingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <span className="material-symbols-outlined text-[44px] text-slate-300 mb-2 block">
          inbox
        </span>
        <p className="text-base font-bold text-zinc-800">Không có xe nào đang chờ</p>
        <p className="text-xs text-slate-500 mt-1">
          Tất cả các xe trong danh mục này đã được xử lý.
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage);

  return (
    <>
      <div className="flex flex-col">
        <div className="overflow-x-auto">
          <table className="table-auto w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 pl-2 pr-1.5 sm:pl-3 sm:pr-2 lg:pl-4 w-10 sm:w-12 text-center">#</th>
                <th className="py-3.5 px-2 sm:px-3 lg:px-4">Thông tin xe & Biển số</th>
                <th className="py-3.5 px-3 lg:px-4 hidden lg:table-cell">Loại dịch vụ</th>
                <th className="py-3.5 px-2 sm:px-3 lg:px-4 hidden sm:table-cell">Khách hàng</th>
                <th className="py-3.5 px-2 sm:px-3 lg:px-4 hidden md:table-cell whitespace-nowrap">Giờ đến</th>
                <th className="py-3.5 px-2 sm:px-3 lg:px-4 whitespace-nowrap">Thời gian chờ</th>
                <th className="py-3.5 pl-2 pr-2 sm:pr-3 lg:pr-4 text-right whitespace-nowrap">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {paginatedItems.map((item, index) => {
                const waitTime = calcWaitTime(item.arrived_at);
                const isLoading = loadingId === item.id;
                const isUrgent = waitTime.minutes > 30;
                const serviceBadges = getServiceCategoryBadges(item);

                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedIntake(item)}
                    className={`hover:bg-slate-50/90 transition-colors cursor-pointer ${
                      isUrgent ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    <td className="py-3.5 sm:py-4 pl-2 pr-1.5 sm:pl-3 sm:pr-2 lg:pl-4 text-center font-mono text-xs text-slate-400 tabular-nums align-top sm:align-middle">
                      {String(startIndex + index + 1).padStart(2, '0')}
                    </td>

                    <td className="py-3.5 sm:py-4 px-2 sm:px-3 lg:px-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 min-w-0">
                        <div className="bg-[#0c2340] text-white px-2.5 py-1 rounded-xl text-xs font-mono font-extrabold tracking-wider whitespace-nowrap shrink-0 self-start sm:self-auto shadow-2xs">
                          {item.vehicle.license_plate}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-zinc-900 truncate" title={`${item.vehicle.make} ${item.vehicle.model}`}>
                            {item.vehicle.make} {item.vehicle.model}
                          </div>
                          {/* Consolidated Customer name + phone on <sm Mobile */}
                          <div className="text-xs text-slate-600 sm:hidden mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                            <span className="font-semibold text-zinc-800 truncate">{item.customer.full_name}</span>
                            <span className="text-slate-400">•</span>
                            <span className="font-mono text-slate-500">{item.customer.phone}</span>
                          </div>
                          {/* Consolidated Service category pills on <lg (Mobile & Tablet Portrait) */}
                          <div className="flex flex-wrap gap-1 mt-1.5 lg:hidden">
                            {serviceBadges.length === 0 ? (
                              <span className="text-[11px] text-slate-400 italic">Chưa xác định</span>
                            ) : (
                              serviceBadges.map((badge, idx) => (
                                <span
                                  key={idx}
                                  title={`Chi tiết: ${badge.serviceNames.join(', ')}`}
                                  className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#0050cd]"
                                >
                                  {badge.category}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-3 lg:px-4 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1.5">
                        {serviceBadges.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">Chưa xác định</span>
                        ) : (
                          serviceBadges.map((badge, idx) => (
                            <span
                              key={idx}
                              title={`Chi tiết: ${badge.serviceNames.join(', ')}`}
                              className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#0050cd]"
                            >
                              {badge.category}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-2 sm:px-3 lg:px-4 hidden sm:table-cell">
                      <div className="min-w-0 max-w-[150px] lg:max-w-[200px]">
                        <div className="font-bold text-zinc-900 truncate" title={item.customer.full_name}>
                          {item.customer.full_name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                          {item.customer.phone}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 sm:py-4 px-2 sm:px-3 lg:px-4 hidden md:table-cell whitespace-nowrap">
                      <div className="font-mono font-semibold text-zinc-900 tabular-nums">
                        {new Date(item.arrived_at).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                        {new Date(item.arrived_at).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 sm:py-4 px-2 sm:px-3 lg:px-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`material-symbols-outlined text-[17px] ${
                              isUrgent ? 'text-rose-600' : 'text-slate-400'
                            }`}
                          >
                            {isUrgent ? 'alarm' : 'schedule'}
                          </span>
                          <span
                            className={`font-mono font-extrabold tabular-nums ${
                              isUrgent ? 'text-rose-600' : 'text-zinc-900'
                            }`}
                          >
                            {waitTime.text}
                          </span>
                        </div>
                        {isUrgent && (
                          <span className="text-[11px] font-bold text-rose-600 block mt-0.5">
                            Quá hạn {waitTime.minutes - 30}p
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 sm:py-4 pl-2 pr-2 sm:pr-3 lg:pr-4 text-right">
                      <div className="flex justify-end gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIntake(item);
                          }}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#f2f4f8] hover:bg-slate-200 text-zinc-700 transition-colors cursor-pointer shadow-2xs"
                          title="Xem chi tiết"
                        >
                          <span className="material-symbols-outlined text-[19px]">visibility</span>
                        </button>
                        {item.status === 'QUEUED' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateWorkOrder(item.id);
                            }}
                            disabled={isLoading}
                            className="w-10 h-10 flex items-center justify-center bg-[#0050cd] hover:bg-[#0866ff] text-white rounded-xl transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                            title="Tạo phiếu công việc"
                          >
                            {isLoading ? (
                              <span className="material-symbols-outlined animate-spin text-[19px]">
                                progress_activity
                              </span>
                            ) : (
                              <span className="material-symbols-outlined text-[19px]">add_task</span>
                            )}
                          </button>
                        )}
                        {item.status === 'CONVERTED' && item.work_order && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/advisor/work-orders/${item.work_order?.id}`);
                            }}
                            className="w-10 h-10 flex items-center justify-center bg-[#0c2340] hover:bg-[#07172c] text-white rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
                            title={`Xem phiếu công việc ${item.work_order.wo_number}`}
                          >
                            <span className="material-symbols-outlined text-[19px]">assignment</span>
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

        {/* Footer */}
        <div className="pt-4 mt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Hiển thị <strong className="text-zinc-900">{startIndex + 1}</strong> –{' '}
            <strong className="text-zinc-900">
              {Math.min(startIndex + itemsPerPage, items.length)}
            </strong>{' '}
            trên <strong className="text-zinc-900">{items.length}</strong> xe
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Số dòng:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-[#f2f4f8] rounded-xl px-2.5 py-1.5 text-xs font-bold text-zinc-900 outline-none"
              >
                <option value={6}>6</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="w-9 h-9 rounded-xl bg-[#f2f4f8] hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center text-zinc-800 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <span className="text-xs font-mono font-bold text-zinc-900 px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="w-9 h-9 rounded-xl bg-[#f2f4f8] hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center text-zinc-800 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedIntake && (
        <IntakeDetailModal
          intake={selectedIntake}
          onClose={() => setSelectedIntake(null)}
          onCreateWO={handleCreateWorkOrder}
          onViewWO={(id) => router.push(`/advisor/work-orders/${id}`)}
          isLoading={loadingId === selectedIntake.id}
        />
      )}
    </>
  );
}
