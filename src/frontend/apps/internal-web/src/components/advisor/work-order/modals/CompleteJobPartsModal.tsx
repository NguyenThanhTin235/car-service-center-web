'use client';

import React from 'react';
import { WoJob } from '@/lib/api/work-order.api';
import ModalPortal from '@/components/advisor/common/ModalPortal';
import toast from 'react-hot-toast';

export interface CompleteJobPartsState {
  job: WoJob;
  usageMap: Record<number, number>;
}

interface CompleteJobPartsModalProps {
  modalState: CompleteJobPartsState | null;
  updatingJobId: number | null;
  onClose: () => void;
  onUpdateUsage: (partId: number, qty: number) => void;
  onConfirm: (jobId: number, entries: Array<{ jobPartId: number; usedQuantity: number }>) => void;
}

export default function CompleteJobPartsModal({
  modalState,
  updatingJobId,
  onClose,
  onUpdateUsage,
  onConfirm,
}: CompleteJobPartsModalProps) {
  if (!modalState) return null;

  const activeParts = (modalState.job.parts || []).filter(
    (p: any) =>
      p.status !== 'RETURNED' &&
      (Number(p.issued_quantity) > 0 || Number(p.planned_quantity) > 0)
  );

  const handleConfirmClick = () => {
    const entries = Object.entries(modalState.usageMap).map(([id, qty]) => ({
      jobPartId: Number(id),
      usedQuantity: Number(qty),
    }));
    const partsList = modalState.job.parts || [];
    const invalid = entries.some((entry) => {
      const p: any = partsList.find((item: any) => item.id === entry.jobPartId);
      const issued =
        Number(p?.issued_quantity) > 0
          ? Number(p?.issued_quantity)
          : Number(p?.planned_quantity) || 0;
      return !Number.isFinite(entry.usedQuantity) || entry.usedQuantity < 0 || entry.usedQuantity > issued;
    });
    if (invalid) {
      toast.error('Số lượng thực dùng phải từ 0 đến số lượng đã xuất');
      return;
    }
    onConfirm(modalState.job.id, entries);
  };

  return (
    <ModalPortal onClose={onClose}>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md sa-modal-backdrop">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xác nhận vật tư thực dùng"
          className="sa-modal-panel bg-surface-container-lowest w-full max-w-2xl rounded-2xl border border-outline-variant shadow-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-low/60">
            <div>
              <h3 className="text-title-md font-bold text-on-surface">
                Xác nhận vật tư thực dùng
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Công việc: <span className="font-semibold text-on-surface">{modalState.job.name}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
            <p className="text-xs text-on-surface-variant">
              Nhập số lượng phụ tùng thực tế đã sử dụng. Phần vật tư dư thừa sẽ tự động hoàn trả lại kho khả dụng.
            </p>

            {activeParts.map((part: any) => {
              const issued =
                Number(part.issued_quantity) > 0
                  ? Number(part.issued_quantity)
                  : Number(part.planned_quantity) || 0;
              const used = modalState.usageMap[part.id] ?? issued;
              const returned = Math.max(0, Number((issued - used).toFixed(2)));
              const partName =
                part.item?.part_category?.name || part.item?.sku || `Phụ tùng #${part.item_id}`;

              return (
                <div
                  key={part.id}
                  className="p-3.5 rounded-xl border border-outline-variant/60 bg-surface-container-low/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">{partName}</p>
                    <div className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-3 font-mono">
                      <span>Đã xuất: <strong className="text-on-surface">{issued}</strong></span>
                      {returned > 0 && (
                        <span className="text-amber-700 font-semibold">
                          Trả lại kho: {returned}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-xs font-semibold text-on-surface-variant whitespace-nowrap">
                      Thực dùng:
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={issued}
                      step="any"
                      value={used}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        onUpdateUsage(part.id, Number.isFinite(val) ? val : 0);
                      }}
                      className="w-24 px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm font-mono font-bold text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-6 py-4 border-t border-outline-variant/40 bg-surface-container-low/50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={updatingJobId !== null}
              className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={updatingJobId !== null}
              onClick={handleConfirmClick}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Xác nhận hoàn tất công việc
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
