'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import warrantyApi, { WarrantyItem, CompletedWorkOrderOption } from '@/lib/api/warranty.api';
import Modal from '@/components/shared/Modal';
import toast from 'react-hot-toast';

export interface WarrantyIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void> | void;
  loading?: boolean;
  customers?: any[];
}

export default function WarrantyIntakeModal({
  isOpen,
  onClose,
  onSubmit,
  loading: externalLoading,
  customers = [],
}: WarrantyIntakeModalProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [parentWoId, setParentWoId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [historyOrders, setHistoryOrders] = useState<CompletedWorkOrderOption[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [warrantyEligibility, setWarrantyEligibility] = useState<{
    tested: boolean;
    loading: boolean;
    hasValidItems: boolean;
    items: WarrantyItem[];
  }>({ tested: false, loading: false, hasValidItems: false, items: [] });

  const availableVehicles = useMemo(() => {
    if (!selectedCustomerId) return [];
    const cust = customers.find((c) => String(c.id) === String(selectedCustomerId));
    return cust?.vehicles || [];
  }, [customers, selectedCustomerId]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedCustomerId('');
      setSelectedVehicleId('');
      setParentWoId('');
      setNotes('');
      setHistoryOrders([]);
      setWarrantyEligibility({ tested: false, loading: false, hasValidItems: false, items: [] });
    }
  }, [isOpen]);

  // Load completed work orders history when vehicle is selected
  useEffect(() => {
    if (!selectedVehicleId) {
      setHistoryOrders([]);
      return;
    }
    const controller = new AbortController();
    setLoadingHistory(true);
    setParentWoId('');
    warrantyApi
      .getCompletedWorkOrders(Number(selectedVehicleId), controller.signal)
      .then((orders) => {
        setHistoryOrders(orders || []);
        if (orders && orders.length > 0) {
          setParentWoId(String(orders[0].id));
        }
      })
      .catch((err) => {
        if (err?.name === 'CanceledError' || err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') {
          return;
        }
        console.error('Lỗi khi tải lịch sử phiếu gốc', err);
        setHistoryOrders([]);
      })
      .finally(() => setLoadingHistory(false));

    return () => controller.abort();
  }, [selectedVehicleId]);

  // Check warranty eligibility by months when vehicle & parent WO are selected
  const checkEligibility = useCallback(async (vId: number, pWoId: number, signal?: AbortSignal) => {
    setWarrantyEligibility((prev) => ({ ...prev, loading: true }));
    try {
      const elig = await warrantyApi.getVehicleWarrantyEligibility(vId, signal);
      const woItems = (elig.items || []).filter((i) => i.workOrderId === pWoId);
      const hasValid = woItems.some((i) => i.status === 'VALID');

      setWarrantyEligibility({
        tested: true,
        loading: false,
        hasValidItems: hasValid,
        items: woItems,
      });
    } catch (err: any) {
      if (err?.name === 'CanceledError' || err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') {
        return;
      }
      setWarrantyEligibility({ tested: true, loading: false, hasValidItems: false, items: [] });
    }
  }, []);

  useEffect(() => {
    if (parentWoId && selectedVehicleId) {
      const controller = new AbortController();
      checkEligibility(Number(selectedVehicleId), Number(parentWoId), controller.signal);
      return () => controller.abort();
    } else {
      setWarrantyEligibility({ tested: false, loading: false, hasValidItems: false, items: [] });
    }
  }, [parentWoId, selectedVehicleId, checkEligibility]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId || !selectedVehicleId) {
      toast.error('Vui lòng chọn khách hàng và phương tiện.');
      return;
    }
    if (!parentWoId) {
      toast.error('Vui lòng chọn phiếu sửa chữa gốc.');
      return;
    }
    if (warrantyEligibility.tested && !warrantyEligibility.hasValidItems) {
      toast.error('Phiếu dịch vụ gốc đã quá hạn bảo hành.');
      return;
    }
    if (!notes.trim()) {
      toast.error('Vui lòng nhập mô tả hiện tượng sự cố của xe.');
      return;
    }

    const payload = {
      customerId: Number(selectedCustomerId),
      vehicleId: Number(selectedVehicleId),
      intakeType: 'WARRANTY',
      arrivedAt: new Date().toISOString(),
      parentWorkOrderId: Number(parentWoId),
      notes: notes.trim(),
    };

    await onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tiếp nhận xe bảo hành"
      size="2xl"
    >
      <div className="space-y-4">
        <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">verified_user</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-900">Quy trình bảo hành theo tháng</span>
              <span className="px-2 py-0.5 rounded bg-emerald-200/70 text-emerald-900 text-[10px] font-mono font-bold tracking-wider uppercase">
                WARRANTY
              </span>
            </div>
            <p className="text-xs text-emerald-800 mt-0.5">
              Kiểm tra thời hạn bảo hành (theo tháng) của các hạng mục trên phiếu dịch vụ gốc
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Chọn khách hàng & Xe */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Khách hàng <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  setSelectedVehicleId('');
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Chọn khách hàng --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName || c.full_name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Phương tiện <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedVehicleId}
                disabled={!selectedCustomerId || availableVehicles.length === 0}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                <option value="">
                  {!selectedCustomerId
                    ? '-- Vui lòng chọn khách trước --'
                    : availableVehicles.length === 0
                      ? '-- Khách chưa có xe --'
                      : '-- Chọn xe --'}
                </option>
                {availableVehicles.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.licensePlate || v.license_plate} ({v.make} {v.model})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Chọn phiếu sửa chữa gốc */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Phiếu dịch vụ gốc cần bảo hành <span className="text-red-500">*</span>
            </label>
            {loadingHistory ? (
              <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            ) : historyOrders.length === 0 ? (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                {selectedVehicleId ? 'Xe chưa có phiếu sửa chữa hoàn tất nào' : 'Vui lòng chọn xe'}
              </div>
            ) : (
              <select
                value={parentWoId}
                onChange={(e) => setParentWoId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {historyOrders.map((wo) => (
                  <option key={wo.id} value={wo.id}>
                    {wo.woNumber} — Hoàn tất:{' '}
                    {wo.completedDate ? new Date(wo.completedDate).toLocaleDateString('vi-VN') : '—'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 3. Trạng thái hạn bảo hành của phiếu gốc */}
          {warrantyEligibility.loading ? (
            <div className="h-14 bg-slate-100 rounded-xl animate-pulse" />
          ) : (
            warrantyEligibility.tested && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tình trạng hạn bảo hành phiếu gốc:
                  </span>
                  {warrantyEligibility.hasValidItems ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Còn hạn bảo hành
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Quá hạn bảo hành
                    </span>
                  )}
                </div>

                {warrantyEligibility.items.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/80">
                    {warrantyEligibility.items.map((item) => (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="p-2.5 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                            {item.warrantyMonths} tháng • Hết hạn:{' '}
                            {item.expirationDate
                              ? new Date(item.expirationDate).toLocaleDateString('vi-VN')
                              : '—'}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            item.status === 'VALID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.status === 'VALID' ? 'Còn hạn' : 'Quá hạn'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          )}

          {/* 4. Mô tả hiện tượng sự cố */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mô tả hiện tượng sự cố khách phản ánh <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Khách phản ánh máy lạnh không mát sau 2 tuần thay lốc lạnh, có tiếng rít lạ..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={externalLoading}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={
                externalLoading ||
                warrantyEligibility.loading ||
                (warrantyEligibility.tested && !warrantyEligibility.hasValidItems) ||
                !selectedCustomerId ||
                !selectedVehicleId ||
                !parentWoId
              }
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {externalLoading ? 'Đang tiếp nhận...' : 'Hoàn tất tiếp nhận bảo hành'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
