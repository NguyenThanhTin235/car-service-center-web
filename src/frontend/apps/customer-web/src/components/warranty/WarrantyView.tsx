'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchVehicles } from '@/store/slices/vehicleSlice';
import warrantyApi, { VehicleWarrantyEligibility, WarrantyItem } from '@/lib/api/warranty.api';

interface WarrantyViewProps {
  isEmbedded?: boolean;
  initialVehicleId?: number;
  onBookWarranty?: (params: {
    vehicleId: number;
    warrantyItemId?: string;
    warrantyItemName?: string;
  }) => void;
}

export default function WarrantyView({ isEmbedded = false, initialVehicleId, onBookWarranty }: WarrantyViewProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { vehicles, loading: vehiclesLoading } = useAppSelector((state) => state.vehicles);

  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    initialVehicleId || null
  );
  const [odometerInput, setOdometerInput] = useState<string>('');
  const [eligibilityData, setEligibilityData] = useState<VehicleWarrantyEligibility | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'VALID' | 'SERVICE' | 'PART'>('ALL');

  useEffect(() => {
    if (vehicles.length === 0) {
      dispatch(fetchVehicles());
    }
  }, [dispatch, vehicles.length]);

  useEffect(() => {
    if (!selectedVehicleId && vehicles.length > 0) {
      setSelectedVehicleId(initialVehicleId || vehicles[0].id);
    }
  }, [vehicles, selectedVehicleId, initialVehicleId]);

  const loadWarrantyData = useCallback(async (vehicleId: number, odo?: number) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await warrantyApi.getVehicleWarrantyEligibility(vehicleId, odo);
      setEligibilityData(data);
      if (odo === undefined && data.currentOdometer > 0) {
        setOdometerInput(data.currentOdometer.toString());
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Không thể tải thông tin bảo hành xe.');
      setEligibilityData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedVehicleId) {
      loadWarrantyData(selectedVehicleId);
    }
  }, [selectedVehicleId, loadWarrantyData]);

  const handleUpdateOdometer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) return;
    const parsedOdo = odometerInput ? parseInt(odometerInput, 10) : undefined;
    if (parsedOdo !== undefined && (isNaN(parsedOdo) || parsedOdo < 0)) {
      setErrorMsg('Số km ODO phải là số nguyên dương hợp lệ.');
      return;
    }
    loadWarrantyData(selectedVehicleId, parsedOdo);
  };

  const handleBookWarranty = (item?: WarrantyItem) => {
    if (!selectedVehicleId) return;
    if (onBookWarranty) {
      onBookWarranty({
        vehicleId: selectedVehicleId,
        warrantyItemId: item?.id,
        warrantyItemName: item?.name,
      });
      return;
    }
    const query = new URLSearchParams({
      tab: 'appointments',
      warranty: 'true',
      vehicle_id: selectedVehicleId.toString(),
    });
    if (item) {
      query.set('warranty_item_id', item.id);
      query.set('warranty_item_name', item.name);
    }
    router.push(`/customer/profile?${query.toString()}`);
  };

  const filteredItems = (eligibilityData?.items || []).filter((item) => {
    if (filterType === 'VALID') {
      return item.status === 'VALID' || item.status === 'OVERDUE_LIGHT';
    }
    if (filterType === 'SERVICE') {
      return item.type === 'SERVICE';
    }
    if (filterType === 'PART') {
      return item.type === 'PART';
    }
    return true;
  });

  return (
    <div className={`space-y-6 ${isEmbedded ? '' : 'max-w-6xl mx-auto py-6'}`}>
      {/* Header section */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">verified_user</span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Sổ bảo hành điện tử</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Theo dõi thời hạn và chính sách bảo hành của dịch vụ và phụ tùng đã thay thế
              </p>
            </div>
          </div>
        </div>

        {/* Quick action button */}
        {selectedVehicleId && (
          <button
            onClick={() => handleBookWarranty()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl shadow-sm hover:bg-blue-700 transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">calendar_add_on</span>
            Đặt lịch bảo hành
          </button>
        )}
      </div>

      {/* Vehicle Selector & Odometer Input */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Vehicle selector */}
          <div className="md:col-span-6">
            <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
              Chọn phương tiện của bạn
            </label>
            {vehiclesLoading ? (
              <div className="h-11 bg-slate-100 rounded-xl animate-pulse" />
            ) : vehicles.length === 0 ? (
              <p className="text-sm text-slate-500 py-2">Bạn chưa có xe nào trong hồ sơ.</p>
            ) : (
              <select
                value={selectedVehicleId || ''}
                onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.licensePlate} — {v.make} {v.model} ({v.year})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Odometer form */}
          <div className="md:col-span-6">
            <form onSubmit={handleUpdateOdometer} className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                  Số km ODO hiện tại
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    placeholder="VD: 45000"
                    value={odometerInput}
                    onChange={(e) => setOdometerInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400">
                    km
                  </span>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 bg-slate-800 text-white font-medium text-sm rounded-xl hover:bg-slate-900 transition-colors disabled:opacity-50 self-end h-[42px]"
              >
                {loading ? 'Đang kiểm tra...' : 'Cập nhật ODO'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Summary Badges */}
      {eligibilityData && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">list_alt</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {eligibilityData.summary.totalItems}
              </div>
              <div className="text-xs font-medium text-slate-500">Tổng hạng mục từng sửa</div>
            </div>
          </div>

          <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-700">
                {eligibilityData.summary.validCount}
              </div>
              <div className="text-xs font-medium text-emerald-600">Còn bảo hành tiêu chuẩn</div>
            </div>
          </div>

          <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-2xl">volunteer_activism</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-700">
                {eligibilityData.summary.overdueLightCount}
              </div>
              <div className="text-xs font-medium text-amber-600">Đủ điều kiện Thiện chí</div>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">event_busy</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-700">
                {eligibilityData.summary.expiredCount}
              </div>
              <div className="text-xs font-medium text-slate-500">Đã hết hạn cam kết</div>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Items list */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${filterType === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Tất cả ({eligibilityData?.items.length || 0})
            </button>
            <button
              onClick={() => setFilterType('VALID')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${filterType === 'VALID'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Đủ điều kiện bảo hành (
              {(eligibilityData?.summary.validCount || 0) +
                (eligibilityData?.summary.overdueLightCount || 0)}
              )
            </button>
            <button
              onClick={() => setFilterType('SERVICE')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${filterType === 'SERVICE'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Công việc / Dịch vụ
            </button>
            <button
              onClick={() => setFilterType('PART')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${filterType === 'PART'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Phụ tùng thay thế
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Đang tra cứu lịch sử và hạn bảo hành phương tiện...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-3">
              <span className="material-symbols-outlined text-3xl">sentiment_dissatisfied</span>
            </div>
            <p className="text-slate-700 font-semibold">Chưa có dữ liệu bảo hành phù hợp</p>
            <p className="text-xs text-slate-500 mt-1">
              Phương tiện này chưa có lịch sử sửa chữa hoặc không có linh kiện nào thuộc bộ lọc đã chọn.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredItems.map((item) => {
              const isGreen = item.badgeColor === 'green';
              const isYellow = item.badgeColor === 'yellow';

              return (
                <div
                  key={item.id}
                  className="p-5 sm:p-6 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${item.type === 'SERVICE'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-indigo-100 text-indigo-700'
                          }`}
                      >
                        {item.type === 'SERVICE' ? 'Dịch vụ' : 'Phụ tùng'}
                      </span>

                      {/* Status badge */}
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${isGreen
                            ? 'bg-emerald-100 text-emerald-800'
                            : isYellow
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isGreen ? 'bg-emerald-500' : isYellow ? 'bg-amber-500' : 'bg-slate-400'
                            }`}
                        />
                        {item.statusLabel}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{item.name}</h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-500 pt-1">
                      <div>
                        <span className="text-slate-400 block">Lệnh sửa chữa:</span>
                        <strong className="text-slate-700 font-medium">{item.parentWoNumber}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Làm ngày & ODO:</span>
                        <span className="text-slate-700">
                          {new Date(item.performedAt).toLocaleDateString('vi-VN')} ({item.releaseOdometer.toLocaleString()} km)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Chính sách bảo hành:</span>
                        <span className="text-slate-700">
                          {item.warrantyMonths} tháng / {item.warrantyMileage.toLocaleString()} km
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Hạn cam kết:</span>
                        <span className="text-slate-700">
                          {new Date(item.expireDate).toLocaleDateString('vi-VN')} ({item.expireMileage.toLocaleString()} km)
                        </span>
                      </div>
                    </div>

                    {isYellow && (
                      <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-2">
                        💡 <strong>Lưu ý:</strong> Hạng mục này đã vượt quá hạn cam kết nhẹ (dưới 15 ngày hoặc 500 km). Quý khách vẫn có thể đặt lịch hẹn để Cố vấn dịch vụ trình Quản lý phê duyệt chính sách <strong>Bảo hành thiện chí</strong>.
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col items-center justify-end gap-2 shrink-0">
                    {(item.status === 'VALID' || item.status === 'OVERDUE_LIGHT') && (
                      <button
                        onClick={() => handleBookWarranty(item)}
                        className={`w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 ${isGreen
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-amber-600 text-white hover:bg-amber-700'
                          }`}
                      >
                        <span className="material-symbols-outlined text-base">build_circle</span>
                        Đặt bảo hành ngay
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

