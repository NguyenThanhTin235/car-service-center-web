'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IntakeQueueItem, createWorkOrder } from '@/lib/api/work-order.api';
import toast from 'react-hot-toast';

/**
 * Tính thời gian chờ từ lúc xe đến (arrived_at) tới hiện tại
 */
function calcWaitTime(arrivedAt: string): { text: string; minutes: number } {
  const diff = Date.now() - new Date(arrivedAt).getTime();
  const totalMinutes = Math.max(0, Math.floor(diff / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return { text: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`, minutes: totalMinutes };
  }
  return { text: `00:${String(minutes).padStart(2, '0')}:00`, minutes: totalMinutes };
}

/**
 * Map intake_type sang label tiếng Việt + style
 */
function getIntakeTypeBadge(type: string) {
  switch (type) {
    case 'WALK_IN':
      return { label: 'Khoang sửa chữa', bgClass: 'bg-surface-container text-on-surface-variant' };
    case 'TOW_IN':
      return { label: 'Khoang cẩu nâng', bgClass: 'bg-error-container/50 text-error' };
    case 'APPOINTMENT':
      return { label: 'Khoang bảo dưỡng', bgClass: 'bg-primary/10 text-primary' };
    default:
      return { label: type, bgClass: 'bg-surface-container text-on-surface-variant' };
  }
}

interface IntakeQueueTableProps {
  items: IntakeQueueItem[];
  onWorkOrderCreated: () => void;
}

export default function IntakeQueueTable({ items, onWorkOrderCreated }: IntakeQueueTableProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleCreateWorkOrder = async (intakeId: number) => {
    setLoadingId(intakeId);
    try {
      const response = await createWorkOrder(intakeId);
      if (response.success) {
        toast.success(`Tạo phiếu ${response.data.wo_number} thành công!`);
        onWorkOrderCreated();
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
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-12 text-center">
        <span className="material-symbols-outlined text-[48px] text-outline mb-3 block">inbox</span>
        <p className="text-headline-md font-headline-md text-on-surface-variant">Không có xe nào đang chờ</p>
        <p className="text-body-sm font-body-sm text-outline mt-1">Tất cả các xe đã được xử lý. Hãy kiểm tra lại sau.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 overflow-hidden">
      {/* Table Header */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-outline-variant/60 bg-surface-container-low/50">
              <th className="px-5 py-3 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider w-10">#</th>
              <th className="px-5 py-3 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Thông tin xe & Biển số</th>
              <th className="px-5 py-3 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Hạng mục dịch vụ đã xong</th>
              <th className="px-5 py-3 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Khách hàng</th>
              <th className="px-5 py-3 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Thời gian chờ</th>
              <th className="px-5 py-3 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40">
            {items.map((item, index) => {
              const waitTime = calcWaitTime(item.arrived_at);
              const intakeTypeBadge = getIntakeTypeBadge(item.intake_type);
              const isLoading = loadingId === item.id;
              const isUrgent = waitTime.minutes > 30;

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-surface-container-low/50 transition-colors ${isUrgent ? 'bg-error-container/5' : ''}`}
                >
                  {/* Row Number */}
                  <td className="px-5 py-4 text-body-sm font-body-sm text-on-surface-variant">
                    {String(index + 1).padStart(2, '0')}
                  </td>

                  {/* Vehicle Info */}
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      {/* License Plate */}
                      <div className="bg-on-surface text-on-primary px-2.5 py-1.5 rounded-lg text-label-md font-label-md font-bold tracking-wider whitespace-nowrap leading-tight">
                        {item.vehicle.license_plate}
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-body-md font-body-md font-semibold text-on-surface">
                            {item.vehicle.make} {item.vehicle.model}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant">
                          <span>ODO: — km</span>
                          <span>•</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${intakeTypeBadge.bgClass}`}>
                            {intakeTypeBadge.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Services */}
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-0.5">
                      {item.services.length > 0 ? (
                        item.services.map((s) => (
                          <span key={s.id} className="text-body-sm font-body-sm text-on-surface">
                            {s.service_template.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-body-sm font-body-sm text-outline italic">Chưa xác định</span>
                      )}
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-label-sm font-label-sm flex-shrink-0">
                        {item.customer.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-body-sm font-body-sm font-medium text-on-surface truncate">
                          {item.customer.full_name}
                        </span>
                        <span className="text-label-sm font-label-sm text-on-surface-variant truncate">
                          {item.customer.phone}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Wait Time */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-[16px] ${isUrgent ? 'text-error' : 'text-on-surface-variant'}`}>
                        {isUrgent ? 'alarm' : 'schedule'}
                      </span>
                      <span className={`text-body-md font-body-md font-bold font-mono ${isUrgent ? 'text-error' : 'text-on-surface'}`}>
                        {waitTime.text}
                      </span>
                    </div>
                    {isUrgent && (
                      <span className="text-label-sm font-label-sm text-error mt-0.5 block">
                        Quá hạn kiểm {waitTime.minutes - 30}p
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleCreateWorkOrder(item.id)}
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-container hover:bg-primary text-on-primary-container hover:text-on-primary rounded-lg text-label-md font-label-md font-medium transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                          <span>Đang tạo...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">add_task</span>
                          <span>Tạo phiếu công việc</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-outline-variant/40 flex items-center justify-between bg-surface-container-low/30">
        <span className="text-label-sm font-label-sm text-on-surface-variant">
          Hiển thị 1 - {items.length} trên tổng số {items.length} xe đang chờ
        </span>
        <div className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant">
          <span>Số dòng:</span>
          <select className="bg-surface-container-lowest border border-outline-variant rounded px-2 py-0.5 text-label-sm font-label-sm text-on-surface">
            <option>6</option>
            <option>10</option>
            <option>20</option>
          </select>
        </div>
      </div>
    </div>
  );
}
