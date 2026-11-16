'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IntakeQueueItem, createWorkOrder } from '@/lib/api/work-order.api';
import toast from 'react-hot-toast';

function calcWaitTime(arrivedAt: string): { text: string; minutes: number } {
  const diff = Date.now() - new Date(arrivedAt).getTime();
  const totalMinutes = Math.max(0, Math.floor(diff / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return {
      text: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`,
      minutes: totalMinutes,
    };
  }
  return { text: `00:${String(minutes).padStart(2, '0')}:00`, minutes: totalMinutes };
}

function getIntakeTypeBadge(type: string) {
  switch (type) {
    case 'WALK_IN':
      return { label: 'Khoang sửa chữa', bgClass: 'bg-slate-100 text-slate-700' };
    case 'TOW_IN':
      return { label: 'Khoang cứu hộ', bgClass: 'bg-rose-50 text-rose-700' };
    case 'APPOINTMENT':
      return { label: 'Khoang bảo dưỡng', bgClass: 'bg-blue-50 text-[#0050cd]' };
    default:
      return { label: type, bgClass: 'bg-slate-100 text-slate-700' };
  }
}

function resolveServiceCategory(svc: any): string {
  if (svc.service?.category?.name) return svc.service.category.name;
  if (svc.category) return svc.category;

  const text = (svc.name || svc.service?.name || '').toLowerCase();
  if (
    text.includes('móp') ||
    text.includes('trầy') ||
    text.includes('xước') ||
    text.includes('sơn') ||
    text.includes('thân') ||
    text.includes('nóc') ||
    text.includes('cửa') ||
    text.includes('panel') ||
    text.includes('gò') ||
    text.includes('vỏ')
  ) {
    return 'Sơn & Đồng';
  }
  if (text.includes('phanh') || text.includes('thắng') || text.includes('má phanh') || text.includes('đĩa phanh')) {
    return 'Hệ thống phanh';
  }
  if (
    text.includes('động cơ') ||
    text.includes('quá nhiệt') ||
    text.includes('nổ máy') ||
    text.includes('bugi') ||
    text.includes('kim phun')
  ) {
    return 'Sửa chữa động cơ';
  }
  if (text.includes('hộp số') || text.includes('trượt số') || text.includes('ly hợp') || text.includes('côn')) {
    return 'Sửa chữa hộp số';
  }
  if (
    text.includes('treo') ||
    text.includes('gầm') ||
    text.includes('giảm xóc') ||
    text.includes('phuộc') ||
    text.includes('rotuyn') ||
    text.includes('thước lái') ||
    text.includes('lốp')
  ) {
    return 'Hệ thống treo & Gầm';
  }
  if (
    text.includes('điện') ||
    text.includes('ắc quy') ||
    text.includes('đèn') ||
    text.includes('máy phát') ||
    text.includes('cầu chì')
  ) {
    return 'Hệ thống điện & Ắc quy';
  }
  if (
    text.includes('vệ sinh') ||
    text.includes('chăm sóc') ||
    text.includes('rửa xe') ||
    text.includes('detailing') ||
    text.includes('nội thất')
  ) {
    return 'Chăm sóc & Vệ sinh';
  }
  if (text.includes('bảo dưỡng') || text.includes('thay dầu') || text.includes('nhớt') || text.includes('lọc')) {
    return 'Bảo dưỡng định kỳ';
  }
  if (text.includes('khắc phục lỗi') || text.includes('hư hỏng')) {
    return 'Sơn & Đồng';
  }
  return svc.name || 'Dịch vụ sửa chữa';
}

function getEffectiveServices(
  item: IntakeQueueItem
): Array<{ id: number | string; name: string; category: string }> {
  if (item.work_order?.services && item.work_order.services.length > 0) {
    return item.work_order.services.map((s: any) => ({
      id: s.id,
      name: s.name || s.service?.name || 'Dịch vụ',
      category: resolveServiceCategory(s),
    }));
  }
  if (item.services && item.services.length > 0) {
    return item.services.map((s: any) => ({
      id: s.id,
      name: s.service?.name || 'Dịch vụ',
      category: resolveServiceCategory(s),
    }));
  }
  return [];
}

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

function IntakeDetailModal({
  intake,
  onClose,
  onCreateWO,
  onViewWO,
  isLoading,
}: {
  intake: IntakeQueueItem;
  onClose: () => void;
  onCreateWO: (id: number) => void;
  onViewWO: (id: number) => void;
  isLoading: boolean;
}) {
  if (!intake) return null;
  const waitTime = calcWaitTime(intake.arrived_at);
  const badge = getIntakeTypeBadge(intake.intake_type);

  let vehicleCondition = '';
  let actualNotes = intake.notes || '';

  if (actualNotes.includes('[Tình trạng xe]:') && actualNotes.includes('[Ghi chú]:')) {
    const vcMatch = actualNotes.match(/\[Tình trạng xe\]:\s*([\s\S]*?)(?=\n\n\[Ghi chú\]:|$)/);
    const nMatch = actualNotes.match(/\[Ghi chú\]:\s*([\s\S]*)/);

    if (vcMatch) vehicleCondition = vcMatch[1].trim();
    if (nMatch) actualNotes = nMatch[1].trim();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-[28px] sm:rounded-[28px] w-full max-w-2xl shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0050cd] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">directions_car</span>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900">Chi tiết xe chờ tiếp nhận</h2>
              <p className="text-xs text-slate-500">Biển số {intake.vehicle.license_plate}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          {/* Status Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-[#f2f4f8] p-3.5 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
              <span className="material-symbols-outlined text-[16px] text-slate-500">schedule</span>
              <span>Giờ đến: {new Date(intake.arrived_at).toLocaleTimeString('vi-VN')}</span>
            </div>
            <div className="w-px h-4 bg-slate-300 hidden sm:block" />
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 font-mono">
              <span className="material-symbols-outlined text-[16px] text-slate-500">timer</span>
              <span>Chờ: {waitTime.text}</span>
            </div>
            <div className="w-px h-4 bg-slate-300 hidden sm:block" />
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${badge.bgClass}`}>
              {badge.label}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Info */}
            <div className="bg-[#f2f4f8] rounded-2xl p-4 flex flex-col gap-2">
              <h3 className="text-xs font-extrabold text-[#0050cd] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">person</span>
                Khách hàng
              </h3>
              <div className="flex flex-col gap-1.5 text-xs sm:text-sm text-zinc-900">
                <p>
                  <span className="text-slate-500 inline-block w-20">Họ tên:</span>{' '}
                  <span className="font-bold">{intake.customer.full_name}</span>
                </p>
                <p>
                  <span className="text-slate-500 inline-block w-20">SĐT:</span>{' '}
                  <span className="font-mono font-bold">{intake.customer.phone}</span>
                </p>
                <p>
                  <span className="text-slate-500 inline-block w-20">Email:</span>{' '}
                  {intake.customer.email || '—'}
                </p>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="bg-[#0c2340] text-white rounded-2xl p-4 flex flex-col gap-2">
              <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">directions_car</span>
                Phương tiện
              </h3>
              <div className="flex flex-col gap-1.5 text-xs sm:text-sm">
                <p>
                  <span className="text-zinc-400 inline-block w-20">Biển số:</span>{' '}
                  <span className="font-mono font-extrabold text-white bg-white/15 px-2 py-0.5 rounded-lg">
                    {intake.vehicle.license_plate}
                  </span>
                </p>
                <p>
                  <span className="text-zinc-400 inline-block w-20">Xe:</span>{' '}
                  <span className="font-bold">
                    {intake.vehicle.make} {intake.vehicle.model}
                  </span>
                </p>
                <p>
                  <span className="text-zinc-400 inline-block w-20">Phân khúc:</span>{' '}
                  {intake.vehicle.vehicle_size} • {intake.vehicle.color || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Requested Services */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-extrabold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#0050cd]">build</span>
              {intake.work_order
                ? 'Hạng mục dịch vụ (Phiếu công việc)'
                : 'Dịch vụ yêu cầu ban đầu'}
            </h3>
            <div className="bg-[#f2f4f8] rounded-2xl p-3.5">
              {(() => {
                const effectiveServices = getEffectiveServices(intake);
                if (effectiveServices.length === 0) {
                  return (
                    <p className="text-xs text-slate-500 italic">
                      Không có dịch vụ cụ thể được yêu cầu
                    </p>
                  );
                }
                return (
                  <ul className="divide-y divide-slate-200/70 flex flex-col">
                    {effectiveServices.map((s, idx) => (
                      <li
                        key={idx}
                        className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                      >
                        <span className="text-xs sm:text-sm text-zinc-900 font-semibold">
                          {s.name}
                        </span>
                        {s.category && (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#0050cd] shrink-0">
                            {s.category}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>
          </div>

          {/* Vehicle Condition & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-xs font-extrabold text-zinc-800 uppercase tracking-wider">
                Mô tả tình trạng xe
              </h3>
              <div className="bg-[#f2f4f8] rounded-2xl p-3.5 min-h-[60px] text-xs sm:text-sm text-zinc-800">
                {vehicleCondition || (
                  <span className="text-slate-400 italic">Không có mô tả tình trạng xe</span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-xs font-extrabold text-zinc-800 uppercase tracking-wider">
                Ghi chú từ Lễ tân
              </h3>
              <div className="bg-[#f2f4f8] rounded-2xl p-3.5 min-h-[60px] text-xs sm:text-sm text-zinc-800 whitespace-pre-wrap">
                {actualNotes || <span className="text-slate-400 italic">Không có ghi chú</span>}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Người tiếp nhận ban đầu:{' '}
            <span className="font-bold text-zinc-900">{intake.created_by.full_name}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Đóng
          </button>
          {intake.status === 'QUEUED' && (
            <button
              type="button"
              onClick={() => onCreateWO(intake.id)}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0050cd] hover:bg-[#0866ff] text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin text-[18px]">
                  progress_activity
                </span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">add_task</span>
              )}
              Tạo phiếu công việc ngay
            </button>
          )}
          {intake.status === 'CONVERTED' && intake.work_order && (
            <button
              type="button"
              onClick={() => onViewWO(intake.work_order!.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0c2340] hover:bg-[#07172c] text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">assignment</span>
              Xem phiếu công việc ({intake.work_order.wo_number})
            </button>
          )}
        </div>
      </div>
    </div>
  );
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
