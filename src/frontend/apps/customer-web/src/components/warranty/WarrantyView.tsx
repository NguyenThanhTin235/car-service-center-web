'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchVehicles } from '@/store/slices/vehicleSlice';
import warrantyApi, {
  VehicleWarrantyEligibility,
  WarrantyItem,
  getWarrantyCompositeKey,
} from '@/lib/api/warranty.api';
import {
  SurfaceCard,
  LoadingSkeleton,
  EmptyState,
  ErrorState,
} from '@/components/ui';

interface WarrantyViewProps {
  isEmbedded?: boolean;
  initialVehicleId?: number;
  onBookWarranty?: (params: {
    vehicleId: number;
    warrantyItemId?: string;
    warrantyItemName?: string;
  }) => void;
}

const STATUS_BADGE_MAP: Record<
  WarrantyItem['status'],
  { label: string; badgeCls: string; dotCls: string }
> = {
  VALID: {
    label: 'Còn hạn',
    badgeCls: 'bg-status-success-soft text-status-success border-emerald-200/80',
    dotCls: 'bg-emerald-500',
  },
  EXPIRED: {
    label: 'Quá hạn',
    badgeCls: 'bg-surface-subtle text-ink-muted border-hairline',
    dotCls: 'bg-slate-400',
  },
};

const formatDateSafe = (iso?: string | null): string => {
  if (!iso) return 'Không giới hạn';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN');
};

export default function WarrantyView({
  isEmbedded = false,
  initialVehicleId,
  onBookWarranty,
}: WarrantyViewProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { vehicles, loading: vehiclesLoading } = useAppSelector((state) => state.vehicles);

  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    initialVehicleId || null
  );
  const [eligibilityData, setEligibilityData] = useState<VehicleWarrantyEligibility | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<
    'ALL' | 'VALID' | 'EXPIRED' | 'SERVICE' | 'PART'
  >('ALL');
  const abortRef = useRef<AbortController | null>(null);

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

  const loadWarrantyData = useCallback(async (vehicleId: number) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await warrantyApi.getVehicleWarrantyEligibility(
        vehicleId,
        controller.signal
      );
      if (controller.signal.aborted) return;
      setEligibilityData(data);
    } catch (err: any) {
      if (
        controller.signal.aborted ||
        err?.name === 'CanceledError' ||
        err?.code === 'ERR_CANCELED'
      ) {
        return;
      }
      setErrorMsg(
        err.response?.data?.message || err.message || 'Không thể tải thông tin bảo hành xe.'
      );
      setEligibilityData(null);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedVehicleId) {
      loadWarrantyData(selectedVehicleId);
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [selectedVehicleId, loadWarrantyData]);

  const handleBookWarranty = (item?: WarrantyItem) => {
    if (!selectedVehicleId) return;
    const compositeId = item ? getWarrantyCompositeKey(item) : undefined;
    if (onBookWarranty) {
      onBookWarranty({
        vehicleId: selectedVehicleId,
        warrantyItemId: compositeId,
        warrantyItemName: item?.name,
      });
      return;
    }
    const query = new URLSearchParams({
      tab: 'appointments',
      warranty: 'true',
      vehicle_id: selectedVehicleId.toString(),
    });
    if (compositeId && item) {
      query.set('warranty_item_id', compositeId);
      query.set('warranty_item_name', item.name);
    }
    router.push(`/customer/profile?${query.toString()}`);
  };

  const allItems = eligibilityData?.items || [];
  const filteredItems = allItems.filter((item) => {
    if (filterType === 'VALID') return item.status === 'VALID';
    if (filterType === 'EXPIRED') return item.status === 'EXPIRED';
    if (filterType === 'SERVICE') return item.type === 'SERVICE';
    if (filterType === 'PART') return item.type === 'PART';
    return true;
  });

  const validCount = eligibilityData?.summary?.validItems ?? 0;

  return (
    <div className={`space-y-6 min-w-0 overflow-x-hidden ${isEmbedded ? '' : 'max-w-[1320px] mx-auto'}`}>
      {/* Header Section */}
      {!isEmbedded && (
        <SurfaceCard
          variant="elevated"
          padding="md"
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">verified_user</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-ink-primary tracking-tight">
                  Bảo hành & Hậu mãi
                </h1>
                <p className="text-sm text-ink-secondary mt-0.5">
                  Tra cứu thời hạn bảo hành theo thời gian (tháng) cho các dịch vụ, phụ tùng đã thay thế.
                </p>
              </div>
            </div>
          </div>
        </SurfaceCard>
      )}

      {/* Vehicle Selector & 3 Summary KPIs */}
      <SurfaceCard variant="elevated" padding="md">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-6 min-w-0">
            <label
              htmlFor="warranty-vehicle-select"
              className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-1.5"
            >
              Chọn phương tiện tra cứu
            </label>
            {vehiclesLoading ? (
              <div className="h-[44px] bg-surface-subtle rounded-xl animate-pulse" />
            ) : vehicles.length === 0 ? (
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-subtle border border-hairline text-sm text-ink-secondary">
                <span>Bạn chưa có xe nào trong hồ sơ.</span>
                <button
                  type="button"
                  onClick={() => router.push('/customer/profile?tab=vehicles')}
                  className="min-h-[44px] px-3 text-accent font-semibold hover:underline shrink-0 cursor-pointer"
                >
                  + Thêm xe
                </button>
              </div>
            ) : (
              <select
                id="warranty-vehicle-select"
                value={selectedVehicleId || ''}
                onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface-subtle border border-hairline rounded-xl text-sm font-semibold text-ink-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.licensePlate} — {v.make} {v.model} ({v.year || 'N/A'})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Summary KPI Strip (3 cards) */}
        {eligibilityData && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-hairline">
            <div className="p-3.5 rounded-xl bg-surface-subtle border border-hairline">
              <div className="text-xs font-medium text-ink-secondary">Tổng hạng mục bảo hành</div>
              <div className="text-xl font-bold font-mono tabular-nums text-ink-primary mt-1">
                {eligibilityData.summary.totalItems}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-status-success-soft border border-emerald-200/70">
              <div className="text-xs font-medium text-status-success">Còn hạn (0đ)</div>
              <div className="text-xl font-bold font-mono tabular-nums text-status-success mt-1">
                {eligibilityData.summary.validItems}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-subtle border border-hairline">
              <div className="text-xs font-medium text-ink-secondary">Quá hạn</div>
              <div className="text-xl font-bold font-mono tabular-nums text-ink-secondary mt-1">
                {eligibilityData.summary.expiredItems}
              </div>
            </div>
          </div>
        )}
      </SurfaceCard>

      {/* Filter Tabs */}
      {eligibilityData && !errorMsg && (
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'ALL', label: `Tất cả (${eligibilityData.summary.totalItems})` },
            { key: 'VALID', label: `Còn hạn (${eligibilityData.summary.validItems})` },
            { key: 'EXPIRED', label: `Quá hạn (${eligibilityData.summary.expiredItems})` },
            { key: 'SERVICE', label: 'Dịch vụ' },
            { key: 'PART', label: 'Phụ tùng thay thế' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterType(tab.key as any)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                filterType === tab.key
                  ? 'bg-accent text-white shadow-xs'
                  : 'bg-surface-elevated text-ink-secondary border border-hairline hover:bg-surface-subtle'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* 4-State Content Area */}
      {loading ? (
        <LoadingSkeleton variant="cards" count={3} />
      ) : errorMsg ? (
        <ErrorState
          title="Không thể tải thông tin bảo hành"
          message={errorMsg}
          onRetry={() => selectedVehicleId && loadWarrantyData(selectedVehicleId)}
        />
      ) : !eligibilityData || filteredItems.length === 0 ? (
        <EmptyState
          icon="verified_user"
          title="Chưa có hạng mục bảo hành phù hợp"
          description={
            eligibilityData?.hasHistory
              ? 'Không có hạng mục nào khớp với bộ lọc hiện tại.'
              : 'Phương tiện này chưa ghi nhận hạng mục dịch vụ hoặc phụ tùng có bảo hành.'
          }
          action={
            filterType !== 'ALL'
              ? { label: 'Xem tất cả hạng mục', onClick: () => setFilterType('ALL') }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const badge = STATUS_BADGE_MAP[item.status] || STATUS_BADGE_MAP.EXPIRED;
            const isValid = item.status === 'VALID';

            return (
              <SurfaceCard
                key={getWarrantyCompositeKey(item)}
                variant="interactive"
                padding="md"
                className="flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-subtle text-ink-secondary text-xs font-semibold border border-hairline">
                      <span className="material-symbols-outlined text-[15px]">
                        {item.type === 'PART' ? 'settings_input_component' : 'build'}
                      </span>
                      {item.type === 'PART' ? 'Phụ tùng' : 'Dịch vụ'}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.badgeCls}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dotCls}`} />
                      {badge.label}
                    </span>
                  </div>

                  {/* Item Name & Origin */}
                  <div>
                    <h3 className="text-base font-bold text-ink-primary">{item.name}</h3>
                    <p className="text-xs text-ink-secondary mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span>
                        Phiếu gốc:{' '}
                        <strong className="font-mono text-ink-primary">{item.woNumber}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Hoàn tất:{' '}
                        <span className="font-mono tabular-nums">
                          {formatDateSafe(item.completedDate)}
                        </span>
                      </span>
                    </p>
                  </div>

                  {/* Limits Box */}
                  <div className="p-3.5 rounded-xl bg-surface-subtle border border-hairline grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-ink-muted">Chính sách bảo hành</div>
                      <div className="font-semibold text-ink-primary mt-0.5 font-mono tabular-nums">
                        {item.warrantyMonths > 0 ? `${item.warrantyMonths} tháng` : 'Không áp dụng'}
                      </div>
                    </div>
                    <div>
                      <div className="text-ink-muted">Ngày hết hạn</div>
                      <div className="font-semibold text-ink-primary mt-0.5 font-mono tabular-nums">
                        {formatDateSafe(item.expirationDate)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="pt-3 border-t border-hairline flex items-center justify-between gap-3">
                  <span className="text-xs text-ink-secondary">
                    {isValid
                      ? item.daysRemaining !== null
                        ? `Còn ${item.daysRemaining} ngày`
                        : 'Đủ điều kiện bảo hành 0đ'
                      : item.overdueDays > 0
                        ? `Đã quá hạn ${item.overdueDays} ngày`
                        : 'Đã hết thời hạn bảo hành'}
                  </span>
                  {isValid && (
                    <button
                      type="button"
                      onClick={() => handleBookWarranty(item)}
                      className="min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 bg-accent hover:bg-accent-hover text-white"
                    >
                      Đặt lịch bảo hành
                    </button>
                  )}
                </div>
              </SurfaceCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
