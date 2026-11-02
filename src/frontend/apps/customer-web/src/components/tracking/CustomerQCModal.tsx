'use client';

import React from 'react';

interface CustomerQCModalProps {
  isOpen: boolean;
  onClose: () => void;
  qcReport: {
    hasQc: boolean;
    isPassed: boolean;
    totalItems: number;
    passedItems: number;
    failedItems: number;
    inspectorName: string;
    inspectedAt: string;
    items: Array<{
      id: number;
      itemName: string;
      serviceName: string;
      result: string;
      notes?: string;
    }>;
  };
  vehiclePlate: string;
  vehicleModel: string;
  woNumber: string;
}

export default function CustomerQCModal({
  isOpen,
  onClose,
  qcReport,
  vehiclePlate,
  vehicleModel,
  woNumber,
}: CustomerQCModalProps) {
  // Deduplicate items defensively by item name to ensure zero duplicate rows
  const displayItems = React.useMemo(() => {
    const map = new Map<string, typeof qcReport.items[0]>();
    for (const item of (qcReport.items || [])) {
      const key = item.itemName.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, { ...item });
      } else {
        const existing = map.get(key)!;
        if (item.result === 'FAIL') {
          existing.result = 'FAIL';
        }
        if (item.serviceName && !existing.serviceName.includes(item.serviceName)) {
          existing.serviceName += `, ${item.serviceName}`;
        }
        if (item.notes && !existing.notes) {
          existing.notes = item.notes;
        }
      }
    }
    return Array.from(map.values());
  }, [qcReport.items]);

  const totalItemsCount = displayItems.length;
  const passedItemsCount = displayItems.filter((i) => i.result === 'PASS').length;
  const isAllPassed = totalItemsCount > 0 && passedItemsCount === totalItemsCount;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-outline-variant flex flex-col overflow-hidden">
        {/* Certificate Header Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-primary p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
              <span className="material-symbols-outlined text-[28px] text-white">verified</span>
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-200">
                Car Service Center • Tiêu Chuẩn KCS
              </span>
              <h3 className="text-xl font-bold tracking-tight">
                Biên Bản Kiểm Định Chất Lượng Xuất Xưởng
              </h3>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-2 text-xs text-blue-100">
            <div>
              Biển số xe: <strong className="text-white font-mono">{vehiclePlate}</strong> ({vehicleModel})
            </div>
            <div>
              Mã phiếu: <strong className="text-white font-mono">{woNumber}</strong>
            </div>
          </div>
        </div>

        {/* Certificate Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Status Badge Banner */}
          {isAllPassed || qcReport.isPassed ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[24px]">verified</span>
              </div>
              <div className="text-xs sm:text-sm">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-100">
                  Đã Đạt Chuẩn Kỹ Thuật & Sẵn Sàng Bàn Giao
                </h4>
                <p className="text-emerald-700 dark:text-emerald-300 text-xs mt-0.5">
                  Đã nghiệm thu đạt {passedItemsCount}/{totalItemsCount} tiêu chí an toàn nghiêm ngặt trước khi xuất xưởng.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">hourglass_top</span>
              </div>
              <div className="text-xs sm:text-sm">
                <h4 className="font-bold text-amber-900 dark:text-amber-100">
                  Đang Trong Quá Trình Hoàn Thiện & Nghiệm Thu
                </h4>
                <p className="text-amber-700 dark:text-amber-300 text-xs mt-0.5">
                  Đội ngũ kỹ thuật viên đang chạy thử nghiệm và kiểm soát chi tiết từng bộ phận.
                </p>
              </div>
            </div>
          )}

          {/* Inspector & Inspection Meta */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant text-xs">
            <div>
              <span className="text-on-surface-variant block">Chuyên viên kiểm định KCS:</span>
              <strong className="text-on-surface font-semibold mt-0.5 block text-sm">
                {qcReport.inspectorName || 'Kỹ thuật viên KCS'}
              </strong>
            </div>
            <div>
              <span className="text-on-surface-variant block">Thời gian nghiệm thu:</span>
              <strong className="text-on-surface font-semibold mt-0.5 block text-sm">
                {qcReport.inspectedAt || 'Đang cập nhật'}
              </strong>
            </div>
          </div>

          {/* Checklist Items */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">fact_check</span>
              <span>Chi tiết danh mục kiểm tra an toàn ({totalItemsCount})</span>
            </h4>

            {totalItemsCount > 0 ? (
              <div className="space-y-2">
                {displayItems.map((item, idx) => {
                  const isPass = item.result === 'PASS';
                  return (
                    <div
                      key={item.id || idx}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm transition-all ${
                        isPass
                          ? 'bg-surface-container-lowest border-outline-variant'
                          : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 text-rose-900'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[12px] shrink-0 mt-0.5 ${
                          isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          <span className="material-symbols-outlined text-[14px]">
                            {isPass ? 'check' : 'close'}
                          </span>
                        </span>
                        <div>
                          <p className="font-semibold text-on-surface">{item.itemName}</p>
                          <span className="text-[11px] text-on-surface-variant">
                            Dịch vụ: {item.serviceName}
                          </span>
                          {item.notes && (
                            <p className={`text-[11px] mt-0.5 flex items-center gap-1 ${
                              !isPass ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-500 italic'
                            }`}>
                              {!isPass && <span className="material-symbols-outlined text-[13px]">warning</span>}
                              <span>{!isPass ? `Lỗi phát hiện: ${item.notes}` : `Ghi chú: ${item.notes}`}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                          isPass
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                        }`}
                      >
                        {isPass ? 'ĐẠT' : 'CẦN CHỈNH'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-on-surface-variant border border-dashed border-outline-variant rounded-xl">
                Các hạng mục đang được cố vấn cập nhật vào hệ thống.
              </div>
            )}
          </div>

          {/* Quality Commitment Notice */}
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-950 dark:text-blue-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-primary">
              <span className="material-symbols-outlined text-[16px]">security</span>
              <span>Cam kết chất lượng dịch vụ:</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Mọi quy trình sửa chữa và phụ tùng thay thế đều được bảo hành theo đúng tiêu chuẩn nhà sản xuất. Quý khách vui lòng kiểm tra đối chiếu tài sản khi nhận xe.
            </p>
          </div>
        </div>

        {/* Certificate Modal Footer */}
        <div className="p-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            Đóng biên bản
          </button>
        </div>
      </div>
    </div>
  );
}

