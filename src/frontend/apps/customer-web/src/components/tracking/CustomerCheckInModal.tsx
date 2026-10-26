'use client';

import React, { useState } from 'react';

interface CustomerCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkIn: {
    id?: number;
    mileage: number;
    fuelLevel: string;
    complaint: string;
    belongings?: string | null;
    exteriorCondition: string;
    status?: string;
    confirmedAt?: string | null;
    evidenceUrls?: any;
    createdAt?: string;
  };
  vehicle: {
    licensePlate: string;
    make: string;
    model: string;
    year?: number;
    color?: string;
    vehicleSize?: string;
  };
  advisor: {
    fullName: string;
    phone?: string;
  };
  woNumber?: string;
}

export default function CustomerCheckInModal({
  isOpen,
  onClose,
  checkIn,
  vehicle,
  advisor,
  woNumber,
}: CustomerCheckInModalProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!isOpen || !checkIn) return null;

  // Format fuel level
  const getFuelInfo = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'EMPTY':
        return { percent: 0, label: 'Bình rỗng (E)', color: 'bg-rose-500' };
      case 'QUARTER':
      case 'ONE_QUARTER':
        return { percent: 25, label: '1/4 bình', color: 'bg-amber-500' };
      case 'HALF':
        return { percent: 50, label: '1/2 bình', color: 'bg-blue-500' };
      case 'THREE_QUARTER':
      case 'THREE_QUARTERS':
        return { percent: 75, label: '3/4 bình', color: 'bg-emerald-500' };
      case 'FULL':
        return { percent: 100, label: 'Đầy bình (F)', color: 'bg-emerald-600' };
      default:
        return { percent: 50, label: level || '1/2 bình', color: 'bg-blue-500' };
    }
  };

  const fuelInfo = getFuelInfo(checkIn.fuelLevel);

  // Parse evidence images
  let photos: string[] = [];
  const rawUrls: any = checkIn.evidenceUrls;
  if (Array.isArray(rawUrls)) {
    photos = rawUrls.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  } else if (typeof rawUrls === 'string') {
    try {
      const parsed = JSON.parse(rawUrls);
      if (Array.isArray(parsed)) {
        photos = parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
      }
    } catch {
      // not JSON
      if (rawUrls.startsWith('http')) {
        photos = [rawUrls];
      }
    }
  }

  // Format time
  const checkInTimestamp = checkIn.confirmedAt || checkIn.createdAt;
  const formattedTime = checkInTimestamp
    ? new Date(checkInTimestamp).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : undefined;

  const isConfirmed = checkIn.status === 'CONFIRMED' || !!checkIn.confirmedAt;

  // Parse complaint (handles JSON { tags: string[], notes: string } or plain text)
  const parseComplaint = (raw: string | undefined | null): { tags: string[]; notes: string } => {
    if (!raw) return { tags: [], notes: '' };
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        const tags: string[] = Array.isArray(parsed.tags)
          ? parsed.tags.filter((t: any): t is string => typeof t === 'string' && t.trim().length > 0)
          : [];
        const notes: string = typeof parsed.notes === 'string' ? parsed.notes.trim() : '';
        return { tags, notes };
      }
    } catch {
      // not a JSON string, treat as plain text note
    }
    return { tags: [], notes: String(raw).trim() };
  };

  const complaintData = parseComplaint(checkIn.complaint);

  // Parse safe text in case exteriorCondition or belongings are ever JSON
  const parseSafeText = (raw: string | undefined | null, fallback: string) => {
    if (!raw || !raw.trim()) return fallback;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string') return parsed.trim() || fallback;
      if (typeof parsed === 'object' && parsed !== null) {
        if (parsed.notes) return String(parsed.notes).trim() || fallback;
        if (parsed.text) return String(parsed.text).trim() || fallback;
        if (Array.isArray(parsed)) return parsed.join(', ') || fallback;
      }
    } catch {
      // plain text
    }
    return raw.trim() || fallback;
  };

  const formattedExterior = parseSafeText(
    checkIn.exteriorCondition,
    'Ngoại quan bình thường, không ghi nhận vết trầy xước nặng lúc nhận xe.'
  );
  const formattedBelongings = parseSafeText(checkIn.belongings, '');

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
        <div className="bg-surface-container-lowest w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl border border-surface-container-highest flex flex-col max-h-[92vh] overflow-hidden">
          
          {/* ================= Header ================= */}
          <div className="p-5 sm:p-6 border-b border-surface-container-highest bg-gradient-to-r from-blue-50/80 via-white to-emerald-50/50 flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md font-mono font-bold bg-blue-100 text-primary border border-blue-200">
                  <span className="material-symbols-outlined text-[14px]">directions_car</span>
                  {vehicle.licensePlate}
                </span>
                {woNumber && (
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-surface-container text-on-surface-variant">
                    #{woNumber}
                  </span>
                )}
                {isConfirmed ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    Đã hoàn tất tiếp nhận
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                    <span className="material-symbols-outlined text-[14px]">fact_check</span>
                    Biên bản tiếp nhận
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-on-surface flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">fact_check</span>
                </span>
                Biên bản Tiếp nhận Xe
              </h2>

              {formattedTime && (
                <p className="text-xs text-on-surface-variant flex items-center gap-1 font-mono">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  Tiếp nhận lúc: <strong className="text-on-surface">{formattedTime}</strong>
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors shrink-0"
              title="Đóng modal"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* ================= Scrollable Body ================= */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
            
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* ODO Metric */}
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-highest flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider">Số ODO</span>
                  <span className="material-symbols-outlined text-[18px] text-primary">speed</span>
                </div>
                <div className="text-lg font-bold font-mono text-on-surface">
                  {Number(checkIn.mileage || 0).toLocaleString('vi-VN')} <span className="text-xs font-normal text-on-surface-variant">km</span>
                </div>
              </div>

              {/* Fuel Level Metric */}
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-highest flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider">Nhiên liệu</span>
                  <span className="material-symbols-outlined text-[18px] text-amber-600">local_gas_station</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-on-surface flex items-center justify-between">
                    <span>{fuelInfo.label}</span>
                    <span className="text-xs font-mono text-on-surface-variant">{fuelInfo.percent}%</span>
                  </div>
                  {/* Visual Fuel Gauge Bar */}
                  <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden mt-1.5 flex">
                    <div
                      className={`h-full ${fuelInfo.color} transition-all duration-500 rounded-full`}
                      style={{ width: `${fuelInfo.percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-highest flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider">Phương tiện</span>
                  <span className="material-symbols-outlined text-[18px] text-blue-600">directions_car</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-on-surface truncate">
                    {vehicle.make} {vehicle.model}
                  </div>
                  <div className="text-xs text-on-surface-variant truncate">
                    {vehicle.color || 'Màu tiêu chuẩn'}{vehicle.year ? ` • ${vehicle.year}` : ''}
                  </div>
                </div>
              </div>

              {/* Advisor Info */}
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-highest flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider">Cố vấn dịch vụ</span>
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">support_agent</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-on-surface truncate">
                    {advisor.fullName}
                  </div>
                  <div className="text-xs text-on-surface-variant font-mono truncate">
                    {advisor.phone || 'Đang tại xưởng'}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: Yêu cầu của khách hàng */}
            <div className="rounded-xl border border-surface-container-highest bg-surface-container-lowest p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-on-surface font-bold text-sm">
                <span className="material-symbols-outlined text-[18px] text-primary">chat_paste_go</span>
                <span>Yêu cầu & Triệu chứng ban đầu của Quý khách</span>
              </div>

              {/* Tags / Yêu cầu cụ thể */}
              {complaintData.tags.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                    Hiện tượng / Vấn đề ghi nhận:
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {complaintData.tags.map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-200 shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[15px] text-primary">check_circle</span>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Ghi chú bổ sung */}
              {complaintData.notes ? (
                <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-100 text-xs sm:text-sm text-on-surface whitespace-pre-wrap leading-relaxed">
                  {complaintData.tags.length > 0 && (
                    <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                      Mô tả chi tiết của Quý khách:
                    </div>
                  )}
                  {complaintData.notes}
                </div>
              ) : complaintData.tags.length === 0 ? (
                <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-on-surface-variant italic">
                  Không ghi nhận phản ánh bất thường khi tiếp nhận.
                </div>
              ) : null}
            </div>

            {/* Section 2: Hiện trạng ngoại quan */}
            <div className="rounded-xl border border-surface-container-highest bg-surface-container-lowest p-4 sm:p-5 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-on-surface font-bold text-sm">
                <span className="material-symbols-outlined text-[18px] text-amber-700">minor_crash</span>
                <span>Hiện trạng ngoại quan & Kiểm tra ban đầu</span>
              </div>
              <div className="p-3.5 rounded-lg bg-amber-50/50 border border-amber-200/70 text-xs sm:text-sm text-on-surface whitespace-pre-wrap leading-relaxed">
                {formattedExterior}
              </div>
            </div>

            {/* Section 3: Đồ đạc / Tài sản trên xe */}
            <div className="rounded-xl border border-surface-container-highest bg-surface-container-lowest p-4 sm:p-5 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-on-surface font-bold text-sm">
                <span className="material-symbols-outlined text-[18px] text-indigo-600">inventory_2</span>
                <span>Tài sản & Đồ đạc để lại trên xe</span>
              </div>
              <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-container-highest text-xs sm:text-sm text-on-surface">
                {formattedBelongings ? (
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[16px] text-indigo-500 shrink-0 mt-0.5">check_circle</span>
                    <span className="whitespace-pre-wrap">{formattedBelongings}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-on-surface-variant italic">
                    <span className="material-symbols-outlined text-[16px] text-outline">info</span>
                    <span>Không có tài sản hoặc đồ đạc có giá trị để lại trên xe.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: Hình ảnh hiện trạng xe */}
            <div className="rounded-xl border border-surface-container-highest bg-surface-container-lowest p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-on-surface font-bold text-sm">
                  <span className="material-symbols-outlined text-[18px] text-purple-600">photo_library</span>
                  <span>Hình ảnh ghi nhận lúc tiếp nhận</span>
                </div>
                {photos.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium border border-purple-200">
                    {photos.length} hình ảnh
                  </span>
                )}
              </div>

              {photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {photos.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPreviewImage(url)}
                      className="group relative aspect-video rounded-lg overflow-hidden border border-surface-container-highest bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <img
                        src={url}
                        alt={`Ảnh kiểm tra tiếp nhận ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[22px] drop-shadow">zoom_in</span>
                      </div>
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono">
                        #{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center rounded-lg bg-surface-container-low border border-dashed border-surface-container-highest text-on-surface-variant space-y-1">
                  <span className="material-symbols-outlined text-[32px] text-outline opacity-60">no_photography</span>
                  <p className="text-xs">Không có hình ảnh đính kèm lúc tiếp nhận phương tiện.</p>
                </div>
              )}
            </div>

            {/* Transparency Note */}
            <div className="p-3.5 rounded-xl bg-blue-50/40 border border-blue-200/60 flex items-start gap-2.5 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">verified_user</span>
              <p>
                Biên bản tiếp nhận là căn cứ minh bạch về hiện trạng phương tiện và tài sản tại thời điểm nhận xe. Quý khách xác nhận một lần duy nhất khi phê duyệt phương án báo giá.
              </p>
            </div>

          </div>

          {/* ================= Footer ================= */}
          <div className="p-4 sm:p-5 border-t border-surface-container-highest bg-surface-container-low/80 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
              <span>Được ghi nhận bởi Cố vấn dịch vụ: <strong className="text-on-surface">{advisor.fullName}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-on-surface bg-white hover:bg-surface-container rounded-xl transition-colors border border-surface-container-highest shadow-2xs"
              >
                Đóng
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Lightbox Modal for Photo Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImage}
              alt="Hình ảnh hiện trạng phóng to"
              className="max-w-full max-h-[82vh] rounded-xl object-contain shadow-2xl border border-white/20"
            />
            <div className="mt-3 flex items-center gap-3">
              <a
                href={previewImage}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                Mở trong tab mới
              </a>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-4 py-1.5 rounded-lg bg-white text-on-surface text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                Đóng ảnh
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
