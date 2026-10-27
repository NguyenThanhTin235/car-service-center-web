'use client';

import React, { useState } from 'react';
import { WorkOrder } from '@/lib/api/work-order.api';
import VehicleReturnModal from '../modals/VehicleReturnModal';

interface TabReleaseProps {
  workOrder: WorkOrder;
  refetchWO: () => void;
  isReadOnly?: boolean;
}

export default function TabRelease({ workOrder, refetchWO, isReadOnly = false }: TabReleaseProps) {
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  const isReleased = workOrder.status === 'RELEASED' || workOrder.status === 'CLOSED';
  const releaseInfo = (workOrder as any).release;

  return (
    <div className="space-y-6">
      {/* Banner trạng thái */}
      {isReleased ? (
        <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[28px]">verified</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-950 dark:text-emerald-100">
                Phương tiện đã hoàn tất bàn giao & xuất xưởng
              </h3>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Hồ sơ phiếu công việc #{workOrder.wo_number} đã chuyển sang trạng thái <b>{workOrder.status}</b>.
              </p>
            </div>
          </div>

          {releaseInfo && (
            <div className="p-4 rounded-xl bg-white/80 dark:bg-surface-container-low border border-emerald-200 dark:border-emerald-900/60 text-xs space-y-1.5 mt-2">
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Thời gian bàn giao:</span>
                <span className="font-mono font-bold text-on-surface">
                  {new Date(releaseInfo.released_at).toLocaleString('vi-VN')}
                </span>
              </div>
              {releaseInfo.release_notes && (
                <div className="pt-1 border-t border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-on-surface-variant font-medium">Ghi chú biên bản:</span>
                  <p className="italic text-on-surface mt-0.5">{releaseInfo.release_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 sm:p-12 text-center border-2 border-dashed border-outline-variant rounded-2xl bg-surface-container-lowest space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
            <span className="material-symbols-outlined text-[36px]">key</span>
          </div>

          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-on-surface">Thủ Tục Bàn Giao & Giao Xe</h3>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Nghiệm thu, đối chiếu tài sản, hoàn tất biên bản và xuất xe cho khách hàng.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => setIsReturnModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">directions_car</span>
              <span>Lập biên bản xuất trả xe</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal xuất trả xe */}
      <VehicleReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        workOrder={workOrder}
        refetchWO={refetchWO}
      />
    </div>
  );
}
