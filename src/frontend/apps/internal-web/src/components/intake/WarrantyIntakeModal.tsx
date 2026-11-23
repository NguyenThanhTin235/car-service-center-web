'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import warrantyApi, { WarrantyItem } from '@/lib/api/warranty.api';
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
  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [parentWoId, setParentWoId] = useState<string>('');
  const [currentOdometer, setCurrentOdometer] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Async data state
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [odoValidation, setOdoValidation] = useState<{
    tested: boolean;
    isValid: boolean;
    message?: string;
    previousOdo?: number;
  }>({ tested: false, isValid: true });

  const [warrantyEligibility, setWarrantyEligibility] = useState<{
    tested: boolean;
    hasValidItems: boolean;
    hasOverdueLight: boolean;
    items: WarrantyItem[];
  }>({ tested: false, hasValidItems: false, hasOverdueLight: false, items: [] });

  // Goodwill Proposal Modal State
  const [isGoodwillModalOpen, setIsGoodwillModalOpen] = useState(false);
  const [goodwillReason, setGoodwillReason] = useState('');
  const [submittingGoodwill, setSubmittingGoodwill] = useState(false);

  // Available vehicles of selected customer
  const availableVehicles = useMemo(() => {
    if (!selectedCustomerId) return [];
    const cust = customers.find((c) => String(c.id) === String(selectedCustomerId));
    return cust?.vehicles || [];
  }, [customers, selectedCustomerId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedCustomerId('');
      setSelectedVehicleId('');
      setParentWoId('');
      setCurrentOdometer('');
      setNotes('');
      setHistoryOrders([]);
      setOdoValidation({ tested: false, isValid: true });
      setWarrantyEligibility({ tested: false, hasValidItems: false, hasOverdueLight: false, items: [] });
    }
  }, [isOpen]);

  // Load completed work orders history when vehicle is selected
  useEffect(() => {
    if (selectedVehicleId) {
      setLoadingHistory(true);
      setParentWoId('');
      warrantyApi
        .getCompletedWorkOrders(Number(selectedVehicleId))
        .then((orders) => {
          setHistoryOrders(orders || []);
          if (orders && orders.length > 0) {
            setParentWoId(String(orders[0].id));
          }
        })
        .catch((err) => {
          console.error('Lỗi khi tải lịch sử phiếu gốc', err);
          setHistoryOrders([]);
        })
        .finally(() => setLoadingHistory(false));
    } else {
      setHistoryOrders([]);
    }
  }, [selectedVehicleId]);

  // Validate ODO and check warranty eligibility
  const validateOdoAndCheckEligibility = useCallback(
    async (pWoId: number, odo: number, vId: number) => {
      try {
        // 1. Kiểm tra chống tua lùi ODO
        const odoRes = await warrantyApi.validateOdoIntake({
          parentWoId: pWoId,
          currentOdometer: odo,
        });

        if (!odoRes.isValid) {
          setOdoValidation({
            tested: true,
            isValid: false,
            message: odoRes.message,
            previousOdo: odoRes.data?.previousReleaseOdo,
          });
          return;
        }

        setOdoValidation({
          tested: true,
          isValid: true,
          previousOdo: odoRes.data?.previousReleaseOdo,
        });

        // 2. Tra cứu trạng thái hạn bảo hành
        const elig = await warrantyApi.getVehicleWarrantyEligibility(vId, odo);
        const hasValid = (elig.items || []).some((i) => i.status === 'VALID');
        const hasLight = (elig.items || []).some((i) => i.status === 'OVERDUE_LIGHT');

        setWarrantyEligibility({
          tested: true,
          hasValidItems: hasValid,
          hasOverdueLight: hasLight,
          items: elig.items || [],
        });
      } catch (err: any) {
        setOdoValidation({
          tested: true,
          isValid: false,
          message: err.response?.data?.message || err.message || 'Lỗi khi xác thực ODO.',
        });
      }
    },
    []
  );

  useEffect(() => {
    if (parentWoId && currentOdometer && selectedVehicleId) {
      const parsedOdo = parseInt(currentOdometer, 10);
      if (!isNaN(parsedOdo) && parsedOdo >= 0) {
        validateOdoAndCheckEligibility(Number(parentWoId), parsedOdo, Number(selectedVehicleId));
      }
    } else {
      setOdoValidation({ tested: false, isValid: true });
      setWarrantyEligibility({ tested: false, hasValidItems: false, hasOverdueLight: false, items: [] });
    }
  }, [parentWoId, currentOdometer, selectedVehicleId, validateOdoAndCheckEligibility]);

  // Handle Goodwill Proposal Submit
  const handleProposeGoodwill = async () => {
    if (!goodwillReason.trim()) {
      toast.error('Vui lòng nhập lý do giải trình đề xuất bảo hành thiện chí.');
      return;
    }

    setSubmittingGoodwill(true);
    try {
      await warrantyApi.createGoodwillClaim({
        vehicleId: Number(selectedVehicleId),
        parentWoId: Number(parentWoId),
        faultDescription: notes.trim() || 'Khách phản ánh sự cố cần hỗ trợ bảo hành thiện chí',
        justificationNotes: goodwillReason.trim(),
        currentOdometer: Number(currentOdometer),
      });

      toast.success('Đã gửi đề xuất bảo hành thiện chí tới Quản lý dịch vụ phê duyệt.');
      setIsGoodwillModalOpen(false);
      setGoodwillReason('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi gửi đề xuất thiện chí.');
    } finally {
      setSubmittingGoodwill(false);
    }
  };

  // Submit Intake Form
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
    if (!currentOdometer) {
      toast.error('Vui lòng nhập số km ODO tiếp nhận hiện tại.');
      return;
    }
    if (odoValidation.tested && !odoValidation.isValid) {
      toast.error('Không thể tiếp nhận do vi phạm chống tua lùi ODO.');
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
      odometer_reading: Number(currentOdometer),
      parent_work_order_id: Number(parentWoId),
      notes: notes.trim(),
    };

    await onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">verified_user</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Tiếp nhận xe bảo hành (UC-83)</h2>
                <span className="px-2 py-0.5 rounded-md bg-white/20 text-xs font-mono font-bold tracking-wider uppercase">
                  WARRANTY
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                Xác thực số km ODO chống tua lùi và kiểm tra hạn bảo hành phiếu dịch vụ gốc
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
                    {c.full_name} ({c.phone})
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

          {/* 2. Chọn phiếu sửa chữa gốc & Nhập ODO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
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
                      {wo.wo_number} — ODO xuất: {wo.release_odometer?.toLocaleString() ?? 'Chưa rõ'} km
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Số km ODO tiếp nhận hiện tại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  placeholder="VD: 52000"
                  value={currentOdometer}
                  onChange={(e) => setCurrentOdometer(e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-mono font-bold pr-12 focus:outline-none focus:ring-2 ${odoValidation.tested && !odoValidation.isValid
                      ? 'border-red-500 text-red-700 focus:ring-red-400 bg-red-50/40'
                      : 'border-slate-200 text-slate-900 focus:ring-emerald-500'
                    }`}
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">km</span>
              </div>
            </div>
          </div>

          {/* 3. Cảnh báo Anti-Tamper ODO & Hạn bảo hành */}
          {odoValidation.tested && !odoValidation.isValid && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
              <div className="flex items-center gap-2 font-bold text-red-900 text-sm">
                <span className="material-symbols-outlined text-lg">warning</span>
                Cảnh báo nghi vấn tua lùi ODO (UC-83)
              </div>
              <p>
                Số km tiếp nhận ({Number(currentOdometer).toLocaleString()} km) nhỏ hơn ODO xuất xưởng
                lần trước ({odoValidation.previousOdo?.toLocaleString() ?? 0} km). Hệ thống chặn tiếp
                nhận để bảo vệ tính toàn vẹn kỹ thuật của xưởng.
              </p>
            </div>
          )}

          {/* Warranty status check results */}
          {warrantyEligibility.tested && odoValidation.isValid && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tình trạng hạn bảo hành phiếu gốc:
                </span>
                {warrantyEligibility.hasValidItems ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Đủ điều kiện bảo hành tiêu chuẩn
                  </span>
                ) : warrantyEligibility.hasOverdueLight ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Quá hạn nhẹ — Cần duyệt Thiện chí
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-200 px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Hết hạn bảo hành
                  </span>
                )}
              </div>

              {/* Overdue light button */}
              {warrantyEligibility.hasOverdueLight && !warrantyEligibility.hasValidItems && (
                <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200">
                  <p className="text-xs text-amber-800">
                    Hạng mục đã quá hạn cam kết nhẹ. Nhân viên tiếp nhận có thể gửi đề xuất hỗ trợ
                    thiện chí tới Quản lý dịch vụ.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsGoodwillModalOpen(true)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shrink-0"
                  >
                    Đề xuất Thiện chí
                  </button>
                </div>
              )}
            </div>
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
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={
                externalLoading ||
                (odoValidation.tested && !odoValidation.isValid) ||
                !selectedCustomerId ||
                !selectedVehicleId ||
                !parentWoId ||
                !currentOdometer
              }
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {externalLoading ? 'Đang tiếp nhận...' : 'Hoàn tất tiếp nhận bảo hành'}
            </button>
          </div>
        </form>
      </div>

      {/* MODAL ĐỀ XUẤT THIỆN CHÍ (GOODWILL PROPOSAL) */}
      {isGoodwillModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-2.5 text-amber-700">
              <span className="material-symbols-outlined text-2xl">volunteer_activism</span>
              <h3 className="text-base font-bold text-slate-900">
                Đề xuất bảo hành thiện chí (UC-86)
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Hạng mục này đã quá hạn cam kết nhẹ. Vui lòng nhập lý do giải trình (khách hàng thân
              thiết, sự cố bất khả kháng...) để Quản lý dịch vụ thẩm định.
            </p>
            <textarea
              rows={4}
              value={goodwillReason}
              onChange={(e) => setGoodwillReason(e.target.value)}
              placeholder="Nhập lý do giải trình cụ thể đề xuất hỗ trợ..."
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsGoodwillModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleProposeGoodwill}
                disabled={submittingGoodwill}
                className="px-5 py-2 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
              >
                {submittingGoodwill ? 'Đang gửi...' : 'Gửi phê duyệt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

