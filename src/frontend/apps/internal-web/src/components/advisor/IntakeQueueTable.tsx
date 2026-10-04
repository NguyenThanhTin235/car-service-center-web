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

function IntakeDetailModal({ intake, onClose, onCreateWO, onViewWO, isLoading }: { intake: IntakeQueueItem, onClose: () => void, onCreateWO: (id: number) => void, onViewWO: (id: number) => void, isLoading: boolean }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface-container-lowest">
          <h2 className="text-title-lg font-bold text-on-surface">Chi tiết xe chờ tiếp nhận</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {/* Status Bar */}
          <div className="flex items-center gap-4 bg-surface-container-low p-3 rounded-lg border border-outline-variant/30">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant">schedule</span>
              <span className="text-label-md font-bold text-on-surface">Giờ đến: {new Date(intake.arrived_at).toLocaleTimeString('vi-VN')}</span>
            </div>
            <div className="w-px h-4 bg-outline-variant/50"></div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant">timer</span>
              <span className="text-label-md font-bold text-on-surface">Chờ: {waitTime.text}</span>
            </div>
            <div className="w-px h-4 bg-outline-variant/50"></div>
            <span className={`px-2 py-0.5 rounded text-label-sm font-bold ${badge.bgClass}`}>{badge.label}</span>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Customer Info */}
            <div className="flex flex-col gap-3">
              <h3 className="text-label-lg font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">person</span>
                Khách hàng
              </h3>
              <div className="flex flex-col gap-2 text-body-md text-on-surface">
                <p><span className="text-on-surface-variant inline-block w-20">Họ tên:</span> <span className="font-semibold">{intake.customer.full_name}</span></p>
                <p><span className="text-on-surface-variant inline-block w-20">SĐT:</span> <span className="font-semibold">{intake.customer.phone}</span></p>
                <p><span className="text-on-surface-variant inline-block w-20">Email:</span> {intake.customer.email || '—'}</p>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="flex flex-col gap-3">
              <h3 className="text-label-lg font-bold text-tertiary flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">directions_car</span>
                Phương tiện
              </h3>
              <div className="flex flex-col gap-2 text-body-md text-on-surface">
                <p><span className="text-on-surface-variant inline-block w-20">Biển số:</span> <span className="font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{intake.vehicle.license_plate}</span></p>
                <p><span className="text-on-surface-variant inline-block w-20">Xe:</span> <span className="font-semibold">{intake.vehicle.make} {intake.vehicle.model}</span></p>
                <p><span className="text-on-surface-variant inline-block w-20">Phân khúc:</span> {intake.vehicle.vehicle_size}</p>
                <p><span className="text-on-surface-variant inline-block w-20">Màu sắc:</span> {intake.vehicle.color || '—'}</p>
              </div>
            </div>
          </div>

          {/* Requested Services */}
          <div className="flex flex-col gap-3">
            <h3 className="text-label-lg font-bold text-secondary flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">build</span>
              Dịch vụ yêu cầu
            </h3>
            <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-3">
              {intake.services.length > 0 ? (
                <ul className="list-disc list-inside text-body-md text-on-surface flex flex-col gap-1">
                  {intake.services.map(s => (
                    <li key={s.id}>{s.service?.name || 'Dịch vụ'}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-body-md text-outline italic">Không có dịch vụ cụ thể được yêu cầu</p>
              )}
            </div>
          </div>

          {/* Vehicle Condition */}
          <div className="flex flex-col gap-3">
            <h3 className="text-label-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">minor_crash</span>
              Mô tả tình trạng xe
            </h3>
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 min-h-[60px] text-body-md text-on-surface">
              {vehicleCondition || <span className="text-outline italic">Không có mô tả tình trạng xe</span>}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-3">
            <h3 className="text-label-lg font-bold text-error flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">note</span>
              Ghi chú từ Staff
            </h3>
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 min-h-[60px] text-body-md text-on-surface whitespace-pre-wrap">
              {actualNotes || <span className="text-outline italic">Không có ghi chú</span>}
            </div>
          </div>
          
          <div className="text-label-sm text-on-surface-variant">
            Người tiếp nhận ban đầu: <span className="font-bold">{intake.created_by.full_name}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-outline-variant/40 bg-surface-container-lowest">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-label-md font-bold text-on-surface hover:bg-surface-container-high transition-colors">
            Đóng
          </button>
          {intake.status === 'QUEUED' && (
            <button 
              onClick={() => onCreateWO(intake.id)} 
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-label-md transition-colors shadow-sm disabled:opacity-50"
            >
              {isLoading ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">add_task</span>}
              Tạo phiếu công việc ngay
            </button>
          )}
          {intake.status === 'CONVERTED' && intake.work_order && (
            <button 
              onClick={() => onViewWO(intake.work_order!.id)} 
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-secondary hover:bg-secondary/90 text-white font-bold text-label-md transition-colors shadow-sm"
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

  // Reset to page 1 when items change (e.g. tab changes)
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
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-12 text-center">
        <span className="material-symbols-outlined text-[48px] text-outline mb-3 block">inbox</span>
        <p className="text-headline-md font-headline-md text-on-surface-variant">Không có xe nào đang chờ</p>
        <p className="text-body-sm font-body-sm text-outline mt-1">Tất cả các xe đã được xử lý. Hãy kiểm tra lại sau.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage);

  return (
    <>
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 overflow-hidden flex flex-col">
        {/* Table Header */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant/60 bg-surface-container-low/50">
                <th className="px-5 py-3 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider w-10">#</th>
                <th className="px-5 py-3 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Thông tin xe & Biển số</th>
                <th className="px-5 py-3 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Loại dịch vụ</th>
                <th className="px-5 py-3 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Khách hàng</th>
                <th className="px-5 py-3 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Thời gian chờ</th>
                <th className="px-5 py-3 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {paginatedItems.map((item, index) => {
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
                      {String(startIndex + index + 1).padStart(2, '0')}
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
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Services / Service Categories */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        {item.services.length > 0 ? (
                          (() => {
                            const uniqueCategories = Array.from(
                              new Set(item.services.map((s) => s.service?.category?.name).filter(Boolean))
                            );
                            if (uniqueCategories.length === 0) {
                              return <span className="text-body-sm font-body-sm text-outline italic">Chưa phân loại</span>;
                            }
                            return uniqueCategories.map((catName, idx) => (
                              <span key={idx} className="inline-flex px-2 py-0.5 rounded text-label-sm font-medium bg-secondary/10 text-secondary border border-secondary/20">
                                {catName}
                              </span>
                            ));
                          })()
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
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedIntake(item)}
                          className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors border border-outline-variant/50"
                          title="Xem chi tiết"
                        >
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </button>
                        {item.status === 'QUEUED' && (
                          <button
                            onClick={() => handleCreateWorkOrder(item.id)}
                            disabled={isLoading}
                            className="w-10 h-10 flex items-center justify-center bg-primary hover:bg-primary/90 text-white rounded-lg transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Tạo phiếu công việc"
                          >
                            {isLoading ? (
                              <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                            ) : (
                              <span className="material-symbols-outlined text-[20px]">add_task</span>
                            )}
                          </button>
                        )}
                        {item.status === 'CONVERTED' && item.work_order && (
                          <button
                            onClick={() => router.push(`/advisor/work-orders/${item.work_order?.id}`)}
                            className="w-10 h-10 flex items-center justify-center bg-secondary hover:bg-secondary/90 text-white rounded-lg transition-all shadow-sm active:scale-[0.98]"
                            title={`Xem phiếu công việc ${item.work_order.wo_number}`}
                          >
                            <span className="material-symbols-outlined text-[20px]">assignment</span>
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
        <div className="px-5 py-3 border-t border-outline-variant/40 flex items-center justify-between bg-surface-container-low/30">
          <span className="text-label-sm font-label-sm text-on-surface-variant">
            Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, items.length)} trên tổng số {items.length} xe
          </span>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant">
              <span>Số dòng:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-surface-container-lowest border border-outline-variant rounded px-2 py-0.5 text-label-sm font-label-sm text-on-surface"
              >
                <option value={6}>6</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-1 rounded-full hover:bg-surface-container disabled:opacity-50 text-on-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <span className="text-label-md font-semibold text-on-surface px-2">
                  {currentPage} / {totalPages}
                </span>
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-1 rounded-full hover:bg-surface-container disabled:opacity-50 text-on-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Detail Modal */}
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
