'use client';

import React from 'react';
import { IntakeQueueItem } from '@/lib/api/work-order.api';
import { formatVehicleSize } from '@/components/advisor/work-order/work-order.constants';
import { getWaitMinutes } from '@/lib/utils/formatters';
import ModalPortal from '@/components/advisor/common/ModalPortal';

export function calcWaitTime(arrivedAt: string): { text: string; minutes: number } {
  const totalMinutes = getWaitMinutes(arrivedAt);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return {
    text: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`,
    minutes: totalMinutes,
  };
}

const INTAKE_TYPE_BADGES: Record<string, { label: string; bgClass: string }> = {
  WALK_IN: { label: 'Khoang sửa chữa', bgClass: 'bg-slate-100 text-slate-700 border border-slate-300' },
  TOW_IN: { label: 'Khoang cứu hộ', bgClass: 'bg-rose-50 text-rose-700 border border-rose-200' },
  APPOINTMENT: { label: 'Khoang bảo dưỡng', bgClass: 'bg-blue-50 text-[#0050cd] border border-blue-200' },
};

export function getIntakeTypeBadge(type: string) {
  return INTAKE_TYPE_BADGES[type] || { label: type, bgClass: 'bg-slate-100 text-slate-700 border border-slate-300' };
}

const SERVICE_CATEGORY_RULES: Array<[string, string[]]> = [
  ['Sơn & Đồng', ['móp', 'trầy', 'xước', 'sơn', 'thân', 'nóc', 'cửa', 'panel', 'gò', 'vỏ', 'khắc phục lỗi', 'hư hỏng']],
  ['Hệ thống phanh', ['phanh', 'thắng', 'má phanh', 'đĩa phanh']],
  ['Sửa chữa động cơ', ['động cơ', 'quá nhiệt', 'nổ máy', 'bugi', 'kim phun']],
  ['Sửa chữa hộp số', ['hộp số', 'trượt số', 'ly hợp', 'côn']],
  ['Hệ thống treo & Gầm', ['treo', 'gầm', 'giảm xóc', 'phuộc', 'rotuyn', 'thước lái', 'lốp']],
  ['Hệ thống điện & Ắc quy', ['điện', 'ắc quy', 'đèn', 'máy phát', 'cầu chì']],
  ['Chăm sóc & Vệ sinh', ['vệ sinh', 'chăm sóc', 'rửa xe', 'detailing', 'nội thất']],
  ['Bảo dưỡng định kỳ', ['bảo dưỡng', 'thay dầu', 'nhớt', 'lọc']],
];

function resolveServiceCategory(svc: any): string {
  if (svc.service?.category?.name) return svc.service.category.name;
  if (svc.category) return svc.category;

  const text = (svc.name || svc.service?.name || '').toLowerCase();
  for (const [category, keywords] of SERVICE_CATEGORY_RULES) {
    if (keywords.some((kw) => text.includes(kw))) {
      return category;
    }
  }
  return svc.name || 'Dịch vụ sửa chữa';
}

export function getEffectiveServices(
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

export interface IntakeDetailModalProps {
  intake: IntakeQueueItem;
  onClose: () => void;
  onCreateWO: (id: number) => void;
  onViewWO: (id: number) => void;
  isLoading: boolean;
}

export default function IntakeDetailModal({
  intake,
  onClose,
  onCreateWO,
  onViewWO,
  isLoading,
}: IntakeDetailModalProps) {
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
    <ModalPortal onClose={onClose}>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-md p-0 sm:p-4 sa-modal-backdrop">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Chi tiết xe chờ tiếp nhận"
          className="sa-modal-panel bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#0050cd] text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">directions_car</span>
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-extrabold text-slate-900 truncate">Chi tiết xe chờ tiếp nhận</h2>
                <p className="text-xs text-slate-600 truncate">
                  Biển số <span className="font-mono font-bold text-slate-900 tabular-nums">{intake.vehicle.license_plate}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="sa-press w-11 h-11 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer shrink-0"
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
                    {formatVehicleSize(intake.vehicle.vehicle_size)} • {intake.vehicle.color || '—'}
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
    </ModalPortal>
  );
}
