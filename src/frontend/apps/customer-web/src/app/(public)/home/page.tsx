'use client';

import React, { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import api from '@/lib/axios';
import { RootState } from '@/store';
import Toast from '@/components/shared/Toast';
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  SurfaceCard,
} from '@/components/ui';

interface ServiceCategory {
  id: number;
  name: string;
  description: string | null;
  _count: { services: number };
}

interface ServiceTemplate {
  id: number;
  name: string;
  description: string | null;
  category: { id: number; name: string };
  pricingType: 'FIXED' | 'VEHICLE_SIZE' | 'LABOUR_PARTS';
  fixedPrice: string | null;
  sizePrices: { vehicleSize: string; price: string }[];
}

interface ProcessStep {
  code: string;
  icon: string;
  title: string;
  description: string;
}

const PROCESS_STEPS: ProcessStep[] = [
  {
    code: '01',
    icon: 'photo_camera',
    title: 'Tiếp nhận - Kiểm tra xe',
    description:
      'Cố vấn dịch vụ ghi nhận tình trạng ngoại thất, số km ODO và lưu ảnh hiện trạng ngay lúc nhận xe.',
  },
  {
    code: '02',
    icon: 'assignment',
    title: 'Lên kế hoạch công việc',
    description:
      'Khảo sát hạng mục cần xử lý, dự kiến thời gian, phân bổ khoang sửa chữa và nguồn phụ tùng.',
  },
  {
    code: '03',
    icon: 'request_quote',
    title: 'Lập báo giá chi tiết',
    description:
      'Tách bạch tiền công kỹ thuật và từng mã phụ tùng kèm đơn giá rõ ràng trước khi tiến hành sửa chữa.',
  },
  {
    code: '04',
    icon: 'fact_check',
    title: 'Phê duyệt trực tuyến',
    description:
      'Chủ xe xem báo giá, đặt câu hỏi hoặc nhấn xác nhận phê duyệt ngay trên điện thoại.',
  },
  {
    code: '05',
    icon: 'engineering',
    title: 'Thi công',
    description:
      'Kỹ thuật viên thực hiện theo đúng hạng mục đã duyệt và cập nhật trạng thái trực tiếp qua cổng khách hàng.',
  },
  {
    code: '06',
    icon: 'verified',
    title: 'Kiểm định chất lượng',
    description:
      'Đội ngũ kiểm tra xuất xưởng nghiệm thu từng đầu việc an toàn trước khi hoàn tất sửa chữa.',
  },
  {
    code: '07',
    icon: 'qr_code_2',
    title: 'Thanh toán trực tuyến',
    description:
      'Quét mã QR SePay đối soát tự động hoặc thanh toán tại quầy, xuất hóa đơn PDF chuẩn mực.',
  },
  {
    code: '08',
    icon: 'directions_car',
    title: 'Bàn giao xe',
    description:
      'Bàn giao xe cho chủ xe, lưu lịch sử bảo dưỡng điện tử và ghi nhận mốc chăm sóc kỳ tiếp theo.',
  },
];

const HERO_GARAGE_PHOTOS = [
  {
    src: '/images/hero-garage.jpg',
    alt: 'Khoang nâng cầu bảo dưỡng và kiểm tra hệ thống phanh tại AutoCare Pro',
    caption: 'Khoang bảo dưỡng & kiểm tra phanh',
  },
  {
    src: '/images/hero-garage-2.jpg',
    alt: 'Kỹ thuật viên chẩn đoán động cơ bằng thiết bị OBD-II chuyên dụng',
    caption: 'Chẩn đoán động cơ & bảo dưỡng định kỳ',
  },
  {
    src: '/images/hero-garage-3.jpg',
    alt: 'Khu vực cân chỉnh góc đặt bánh xe 3D tại xưởng AutoCare Pro',
    caption: 'Cân chỉnh thước lái & lốp 3D',
  },
  {
    src: '/images/hero-garage-4.jpg',
    alt: 'Kiểm định chất lượng KCS dưới hệ thống đèn chiếu sáng tiêu chuẩn',
    caption: 'Kiểm định chất lượng KCS trước xuất xưởng',
  },
  {
    src: '/images/hero-garage-5.jpg',
    alt: 'Khu tiếp nhận xe và cố vấn dịch vụ làm việc trực tiếp cùng khách hàng',
    caption: 'Tiếp nhận xe & cố vấn dịch vụ',
  },
];

const HERO_PILLARS = [
  {
    icon: 'request_quote',
    title: 'Báo giá minh bạch',
    description: 'Phê duyệt từng hạng mục phụ tùng và tiền công trước khi thi công.',
  },
  {
    icon: 'verified',
    title: 'Kiểm định KCS',
    description: 'Lưu ảnh kiểm tra tiếp nhận và kết quả nghiệm thu trước xuất xưởng.',
  },
  {
    icon: 'qr_code_2',
    title: 'Thanh toán SePay',
    description: 'Đối soát chuyển khoản tức thì qua mã QR và tải hóa đơn PDF chuẩn mực.',
  },
];

const getServiceIcon = (name: string, catName: string) => {
  const lower = name.toLowerCase();
  const catLower = catName.toLowerCase();
  if (lower.includes('bảo dưỡng') || lower.includes('nhớt')) return 'oil_barrel';
  if (lower.includes('động cơ') || lower.includes('hộp số')) return 'settings';
  if (lower.includes('nội thất') || lower.includes('ngoại thất')) return 'auto_awesome';
  if (lower.includes('phanh') || lower.includes('lốp')) return 'tire_repair';
  if (lower.includes('điện') || lower.includes('điều hòa')) return 'ac_unit';
  if (lower.includes('cứu hộ') || lower.includes('bảo hiểm')) return 'shield';

  if (catLower.includes('repair') || catLower.includes('sửa')) return 'build';
  if (catLower.includes('maintenance') || catLower.includes('bảo dưỡng')) return 'settings';
  if (catLower.includes('wash') || catLower.includes('rửa')) return 'local_car_wash';
  if (catLower.includes('detail') || catLower.includes('chăm sóc')) return 'auto_fix_high';
  return 'car_repair';
};

function formatPrice(price: string | number) {
  return Number(price).toLocaleString('vi-VN') + ' ₫';
}

function getServicePriceMeta(svc: ServiceTemplate): { text: string; isNumeric: boolean } {
  if (svc.pricingType === 'FIXED' && svc.fixedPrice) {
    return { text: formatPrice(svc.fixedPrice), isNumeric: true };
  }
  if (svc.pricingType === 'VEHICLE_SIZE' && svc.sizePrices.length > 0) {
    const prices = svc.sizePrices.map((sp) => Number(sp.price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) {
      return { text: formatPrice(minPrice), isNumeric: true };
    }
    return { text: `Từ ${formatPrice(minPrice)}`, isNumeric: true };
  }
  return { text: 'Khảo sát & báo giá', isNumeric: false };
}

const HeroSection = memo(function HeroSection({
  bookingHref,
  trackingHref,
}: {
  bookingHref: string;
  trackingHref: string;
}) {
  const [activePillar, setActivePillar] = useState(0);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isPhotoPaused, setIsPhotoPaused] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePillar((prev) => (prev + 1) % HERO_PILLARS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isPhotoPaused) return;
    const photoTimer = setInterval(() => {
      setActivePhotoIndex((prev) => (prev + 1) % HERO_GARAGE_PHOTOS.length);
    }, 4000);
    return () => clearInterval(photoTimer);
  }, [isPhotoPaused]);

  return (
    <section className="w-full hero-banner-surface text-white">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Editorial Narrative (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="hero-reveal text-3xl sm:text-4xl font-bold text-white tracking-[-0.03em] leading-[1.16] max-w-2xl">
              Chăm sóc xe minh bạch từ lúc tiếp nhận đến khi bàn giao.
            </h1>

            <p className="hero-reveal hero-reveal-1 text-base sm:text-lg text-white/85 leading-relaxed max-w-[58ch]">
              Đặt lịch bảo dưỡng trực tuyến, theo dõi từng hạng mục kỹ thuật theo thời gian
              thực, duyệt báo giá chi tiết 0% VAT và thanh toán SePay ngay trên điện thoại.
            </p>

            <div className="hero-reveal hero-reveal-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <Link
                href={bookingHref}
                className="group inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-xl bg-surface-elevated hover:bg-surface-subtle text-accent text-sm font-semibold active:scale-[0.98] transition-all duration-150"
              >
                <span>Đặt lịch bảo dưỡng</span>
                <span
                  className="material-symbols-outlined text-lg transition-transform duration-150 group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  arrow_forward
                </span>
              </Link>
              <Link
                href={trackingHref}
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-semibold active:scale-[0.98] transition-all duration-150"
              >
                <span className="material-symbols-outlined text-lg text-white" aria-hidden="true">
                  timeline
                </span>
                <span>Theo dõi tiến độ xe</span>
              </Link>
            </div>

            {/* Factual Portal Capabilities Strip (Automatic Highlight Cycle) */}
            <div className="hero-reveal hero-reveal-3 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-white/15">
              {HERO_PILLARS.map((pillar, index) => {
                const isActive = activePillar === index;
                return (
                  <div
                    key={pillar.title}
                    onMouseEnter={() => setActivePillar(index)}
                    className={`rounded-xl p-3 border transition-all duration-300 ${
                      isActive
                        ? 'bg-white/12 border-white/25'
                        : 'bg-transparent border-transparent'
                    }`}
                  >
                    <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                      <span
                        className="material-symbols-outlined text-lg text-white"
                        aria-hidden="true"
                      >
                        {pillar.icon}
                      </span>
                      <span>{pillar.title}</span>
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed mt-1">
                      {pillar.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Real Garage Photo Carousel (5 cols) */}
          <div className="lg:col-span-5 hero-card-enter">
            <div
              onMouseEnter={() => setIsPhotoPaused(true)}
              onMouseLeave={() => setIsPhotoPaused(false)}
              className="group rounded-2xl bg-surface-elevated p-2.5 text-ink-primary overflow-hidden"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-surface-subtle">
                {HERO_GARAGE_PHOTOS.map((photo, idx) => {
                  const isCurrent = idx === activePhotoIndex;
                  return (
                    <img
                      key={photo.src}
                      src={photo.src}
                      alt={photo.alt}
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      fetchPriority={idx === 0 ? 'high' : 'auto'}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-out ${
                        isCurrent
                          ? 'opacity-100 z-10 hero-photo-motion'
                          : 'opacity-0 z-0 pointer-events-none'
                      }`}
                    />
                  );
                })}
              </div>
              <div className="px-2.5 pt-3 pb-1 flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-ink-secondary truncate">
                  {HERO_GARAGE_PHOTOS[activePhotoIndex].caption}
                </span>
                <div
                  className="flex items-center gap-0.5 shrink-0"
                  role="tablist"
                  aria-label="Chọn ảnh xưởng dịch vụ"
                >
                  {HERO_GARAGE_PHOTOS.map((photo, idx) => {
                    const isCurrent = idx === activePhotoIndex;
                    return (
                      <button
                        key={photo.src}
                        type="button"
                        role="tab"
                        aria-selected={isCurrent}
                        aria-label={`Ảnh xưởng ${idx + 1}: ${photo.caption}`}
                        onClick={() => setActivePhotoIndex(idx)}
                        className="min-h-[28px] px-1 inline-flex items-center justify-center cursor-pointer"
                      >
                        <span
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            isCurrent ? 'w-5 bg-accent' : 'w-1.5 bg-surface-muted'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

const ProcessStepperSection = memo(function ProcessStepperSection() {
  const [activeProcessStep, setActiveProcessStep] = useState(0);
  const [isProcessPaused, setIsProcessPaused] = useState(false);

  useEffect(() => {
    if (isProcessPaused) return;
    const processTimer = setInterval(() => {
      setActiveProcessStep((prev) => (prev + 1) % PROCESS_STEPS.length);
    }, 3500);
    return () => clearInterval(processTimer);
  }, [isProcessPaused]);

  return (
    <section id="process" className="w-full bg-canvas border-b border-hairline py-10 sm:py-12 scroll-mt-16">
      <div
        className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8"
        onMouseEnter={() => setIsProcessPaused(true)}
        onMouseLeave={() => setIsProcessPaused(false)}
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-ink-primary tracking-[-0.02em]">
              Quy trình tiếp nhận &amp; bàn giao 8 bước
            </h2>
            <p className="text-sm sm:text-base text-ink-secondary mt-2 leading-relaxed">
              Mọi thay đổi phát sinh đều cần xác nhận từ chủ xe và được lưu vết đầy đủ trên hồ
              sơ bảo dưỡng điện tử.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-ink-secondary bg-surface-elevated border border-hairline px-3.5 min-h-[40px] rounded-full shrink-0 self-start md:self-auto">
            <span className="font-mono tabular-nums text-accent font-bold">
              {PROCESS_STEPS[activeProcessStep].code} / 08
            </span>
            <span className="truncate max-w-[220px]">
              {PROCESS_STEPS[activeProcessStep].title}
            </span>
          </div>
        </div>

        {/* Desktop Interactive Connected Stepper Track */}
        <div className="hidden lg:block relative mb-8">
          <div
            className="absolute top-1/2 left-8 right-8 h-0.5 -translate-y-1/2 bg-surface-muted"
            aria-hidden="true"
          />
          <div className="relative grid grid-cols-8 gap-3">
            {PROCESS_STEPS.map((step, idx) => {
              const isActive = idx === activeProcessStep;
              const isCompleted = idx < activeProcessStep;
              return (
                <button
                  key={step.code}
                  type="button"
                  onClick={() => setActiveProcessStep(idx)}
                  className="flex flex-col items-center gap-2 cursor-pointer group"
                >
                  <span
                    className={`w-11 h-11 rounded-full font-mono tabular-nums text-xs font-bold flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? 'bg-accent text-white scale-110'
                        : isCompleted
                        ? 'bg-accent-soft text-accent-ink'
                        : 'bg-surface-elevated border border-hairline-strong text-ink-secondary group-hover:border-accent'
                    }`}
                  >
                    {step.code}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 8-Step Cards Grid (4x2 on desktop, 2x4 on tablet) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {PROCESS_STEPS.map((step, idx) => {
            const isActive = idx === activeProcessStep;
            return (
              <button
                key={step.code}
                type="button"
                onClick={() => setActiveProcessStep(idx)}
                onMouseEnter={() => setActiveProcessStep(idx)}
                className={`text-left rounded-2xl bg-surface-elevated border p-5 sm:p-6 flex flex-col justify-between gap-4 transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'border-accent -translate-y-0.5'
                    : 'border-hairline hover:border-hairline-strong'
                }`}
              >
                <div className="space-y-3 w-full">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`font-mono tabular-nums text-xs font-bold px-2.5 py-1 rounded-full transition-colors duration-300 ${
                        isActive
                          ? 'bg-accent text-white'
                          : 'bg-accent-soft text-accent-ink'
                      }`}
                    >
                      Bước {step.code}
                    </span>
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                        isActive
                          ? 'bg-accent-soft text-accent'
                          : 'bg-surface-subtle text-ink-muted'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl" aria-hidden="true">
                        {step.icon}
                      </span>
                    </div>
                  </div>

                  <h3
                    className={`text-base font-semibold transition-colors duration-200 ${
                      isActive ? 'text-accent' : 'text-ink-primary'
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm text-ink-secondary leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Subtle animated step progress bar */}
                <div className="w-full h-1 rounded-full bg-surface-subtle overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-accent transition-all duration-500 ${
                      isActive ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
});

export default function HomePage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [mounted, setMounted] = useState(false);

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceTemplate[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAllServices, setShowAllServices] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [directionsOrigin, setDirectionsOrigin] = useState('');
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const msg = sessionStorage.getItem('auth_toast');
      if (msg) {
        setToastMessage(msg);
        sessionStorage.removeItem('auth_toast');
      }
    }
  }, []);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [catRes, svcRes] = await Promise.all([
        api.get('/api/public/categories'),
        api.get('/api/public/services'),
      ]);
      setCategories(Array.isArray(catRes.data?.data) ? catRes.data.data : []);
      setServices(Array.isArray(svcRes.data?.data) ? svcRes.data.data : []);
    } catch {
      setError('Không thể tải danh mục dịch vụ từ máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesCat = activeCategory ? s.category.id === activeCategory : true;
      const matchesQuery = normalizedQuery
        ? s.name.toLowerCase().includes(normalizedQuery) ||
          (s.description || '').toLowerCase().includes(normalizedQuery) ||
          s.category.name.toLowerCase().includes(normalizedQuery)
        : true;
      return matchesCat && matchesQuery;
    });
  }, [services, activeCategory, normalizedQuery]);

  const servicesToDisplay = showAllServices ? filteredServices : filteredServices.slice(0, 6);

  const bookingHref = mounted && isAuthenticated ? '/customer/appointments' : '/login';
  const quickBookHref = mounted && isAuthenticated ? '/customer/appointments/new' : '/login';
  const trackingHref = mounted && isAuthenticated ? '/customer/tracking' : '/login';

  const handleUseCurrentLocation = () => {
    setGeoError('');
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoError('Trình duyệt không hỗ trợ định vị GPS.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`;
        setDirectionsOrigin(coords);
        setLocating(false);
      },
      () => {
        setGeoError('Không thể truy cập vị trí. Vui lòng cấp quyền định vị trên trình duyệt.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const mapEmbedUrl = directionsOrigin
    ? `https://maps.google.com/maps?saddr=${encodeURIComponent(directionsOrigin)}&daddr=Khu%20Cong%20Nghe%20Cao,%20Thu%20Duc,%20Ho%20Chi%20Minh&hl=vi&output=embed`
    : 'https://maps.google.com/maps?q=Khu%20Cong%20Nghe%20Cao,%20Thu%20Duc,%20Ho%20Chi%20Minh&t=&z=15&ie=UTF8&iwloc=&output=embed';

  return (
    <>
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          duration={4000}
          onClose={() => setToastMessage('')}
        />
      )}

      {/* ================= 1. EDITORIAL HERO BANNER (7/5 SPLIT) ================= */}
      <HeroSection bookingHref={bookingHref} trackingHref={trackingHref} />

      {/* ================= 2. DYNAMIC SERVICE CATALOG ================= */}
      <section id="services" className="w-full bg-surface-elevated border-b border-hairline py-10 sm:py-12 scroll-mt-16">
        <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-ink-primary tracking-[-0.02em]">
                Danh mục dịch vụ tiêu chuẩn
              </h2>
              <p className="text-sm sm:text-base text-ink-secondary mt-2 leading-relaxed">
                Lựa chọn gói bảo dưỡng định kỳ, sửa chữa chuyên sâu hoặc chăm sóc xe với mức chi
                phí công khai trước khi thực hiện.
              </p>
            </div>

            {!loading && !error && services.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <span
                    className="material-symbols-outlined text-lg text-ink-muted pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  >
                    search
                  </span>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowAllServices(false);
                    }}
                    placeholder="Tìm nhanh dịch vụ..."
                    aria-label="Tìm nhanh dịch vụ"
                    className="w-full min-h-[44px] pl-10 pr-9 rounded-xl bg-surface-subtle border border-transparent focus:border-accent focus:bg-surface-elevated text-sm text-ink-primary placeholder:text-ink-muted transition-colors focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Xóa từ khóa tìm kiếm"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink-primary hover:bg-surface-muted transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base" aria-hidden="true">
                        close
                      </span>
                    </button>
                  )}
                </div>
                <span className="font-mono tabular-nums text-xs font-semibold text-ink-secondary bg-surface-subtle px-3.5 min-h-[44px] rounded-xl inline-flex items-center justify-center shrink-0">
                  {servicesToDisplay.length}/{filteredServices.length} hạng mục
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <LoadingSkeleton variant="cards" count={6} />
          ) : error ? (
            <ErrorState
              title="Không thể tải danh mục dịch vụ"
              message={error}
              onRetry={fetchCatalog}
            />
          ) : (
            <>
              {/* Category Filter Pills (horizontal scroll with visible scrollbar) */}
              <div
                className="flex items-center gap-2 overflow-x-auto styled-scrollbar-x pb-3 mb-7 -mx-4 px-4 sm:mx-0 sm:px-0"
                role="tablist"
                aria-label="Lọc theo nhóm dịch vụ"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === null}
                  onClick={() => {
                    setActiveCategory(null);
                    setShowAllServices(false);
                  }}
                  className={`shrink-0 min-h-[42px] px-4 rounded-full text-sm font-semibold border transition-all duration-200 cursor-pointer whitespace-nowrap inline-flex items-center gap-2 ${
                    activeCategory === null
                      ? 'bg-accent text-white border-accent shadow-[0_6px_16px_-6px_rgba(0,80,205,0.55)]'
                      : 'bg-white text-slate-700 border-slate-200/90 hover:border-accent/50 hover:bg-[#F4F8FF] hover:text-accent shadow-2xs'
                  }`}
                >
                  <span>Tất cả</span>
                  <span
                    className={`font-mono tabular-nums text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      activeCategory === null
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {services.length}
                  </span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={activeCategory === cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setShowAllServices(false);
                    }}
                    className={`shrink-0 min-h-[42px] px-4 rounded-full text-sm font-semibold border transition-all duration-200 cursor-pointer whitespace-nowrap inline-flex items-center gap-2 ${
                      activeCategory === cat.id
                        ? 'bg-accent text-white border-accent shadow-[0_6px_16px_-6px_rgba(0,80,205,0.55)]'
                        : 'bg-white text-slate-700 border-slate-200/90 hover:border-accent/50 hover:bg-[#F4F8FF] hover:text-accent shadow-2xs'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span
                      className={`font-mono tabular-nums text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        activeCategory === cat.id
                          ? 'bg-white/20 text-white'
                          : 'bg-[#EEF4FF] text-accent'
                      }`}
                    >
                      {cat._count.services}
                    </span>
                  </button>
                ))}
              </div>

              {filteredServices.length === 0 ? (
                <EmptyState
                  icon="car_repair"
                  title="Không tìm thấy dịch vụ phù hợp"
                  description="Vui lòng thử từ khóa khác, chọn nhóm dịch vụ khác hoặc đặt lịch để cố vấn tiếp nhận kiểm tra trực tiếp cho xe."
                  action={
                    activeCategory !== null || searchQuery.trim() !== ''
                      ? {
                          label: 'Xem tất cả dịch vụ',
                          onClick: () => {
                            setActiveCategory(null);
                            setSearchQuery('');
                          },
                        }
                      : undefined
                  }
                />
              ) : (
                <>
                  <div
                    key={`${activeCategory ?? 'all'}-${normalizedQuery}-${showAllServices}`}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                  >
                    {servicesToDisplay.map((svc, idx) => {
                      const iconName = getServiceIcon(svc.name, svc.category.name);
                      const priceMeta = getServicePriceMeta(svc);

                      return (
                        <div
                          key={svc.id}
                          style={{ animationDelay: `${Math.min(idx * 45, 270)}ms` }}
                          className="group svc-card-enter h-full"
                        >
                          {/* Child element animates on parent group-hover to prevent hover-boundary flicker (web-animation-design) */}
                          <div className="relative flex flex-col justify-between h-full rounded-2xl bg-surface-elevated border border-accent/40 shadow-[0_10px_26px_-10px_rgba(0,80,205,0.16)] will-change-transform group-hover:-translate-y-1.5 group-hover:border-accent group-hover:ring-4 group-hover:ring-accent/10 group-hover:shadow-[0_20px_38px_-12px_rgba(0,80,205,0.28)] transition-[transform,border-color,box-shadow] duration-250 ease-[cubic-bezier(0.165,0.84,0.44,1)] motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 overflow-hidden">
                            {/* Subtle Diagonal Light Sweep on Hover (GPU-only transform) */}
                            <div
                              className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-0 will-change-transform group-hover:opacity-100 group-hover:translate-x-[320%] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:hidden z-20"
                              aria-hidden="true"
                            />

                            {/* Top Royal Sapphire Accent Strip */}
                            <div
                              className="h-1 w-full bg-gradient-to-r from-[#0050CD] via-[#2563EB] to-[#60A5FA] group-hover:from-[#003EA3] group-hover:via-[#0050CD] group-hover:to-[#3B82F6] transition-colors duration-200 ease-out"
                              aria-hidden="true"
                            />

                            <div className="relative z-10 p-5 sm:p-6 flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="w-12 h-12 rounded-2xl bg-accent text-white border border-accent flex items-center justify-center shrink-0 shadow-xs will-change-transform transition-[transform,box-shadow] duration-250 ease-[cubic-bezier(0.165,0.84,0.44,1)] group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-[0_8px_18px_-4px_rgba(0,80,205,0.45)] motion-reduce:group-hover:scale-100 motion-reduce:group-hover:rotate-0">
                                    <span
                                      className="material-symbols-outlined text-[22px]"
                                      aria-hidden="true"
                                    >
                                      {iconName}
                                    </span>
                                  </div>
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-accent text-white border border-accent shadow-2xs will-change-transform transition-transform duration-200 ease-[cubic-bezier(0.165,0.84,0.44,1)] group-hover:scale-[1.03] motion-reduce:group-hover:scale-100">
                                    <span
                                      className="w-1.5 h-1.5 rounded-full bg-white shrink-0"
                                      aria-hidden="true"
                                    />
                                    <span>{svc.category.name}</span>
                                  </span>
                                </div>

                                <h3 className="text-base sm:text-lg font-bold text-ink-primary group-hover:text-accent transition-colors duration-150 mt-4 leading-snug">
                                  {svc.name}
                                </h3>
                                <p className="text-sm text-ink-secondary leading-relaxed mt-2 line-clamp-2 min-h-[2.75rem]">
                                  {svc.description ||
                                    'Thực hiện theo quy trình kiểm tra kỹ thuật và nghiệm thu KCS tại xưởng.'}
                                </p>
                              </div>

                              <div className="mt-5 p-3.5 rounded-xl bg-[#F4F8FF] border border-accent/20 group-hover:bg-[#EBF2FF] group-hover:border-accent/40 transition-colors duration-200 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
                                    Chi phí tham khảo
                                  </p>
                                  <p
                                    className={
                                      priceMeta.isNumeric
                                        ? 'font-mono tabular-nums text-base sm:text-[17px] font-bold text-ink-primary group-hover:text-accent transition-colors duration-150 mt-0.5'
                                        : 'text-sm font-semibold text-bronze-ink mt-0.5'
                                    }
                                  >
                                    {priceMeta.text}
                                  </p>
                                </div>
                                <Link
                                  href={quickBookHref}
                                  className="group/btn inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-xl bg-accent group-hover:bg-[#003EA3] active:scale-[0.97] text-white text-xs font-bold transition-[background-color,transform,box-shadow] duration-150 ease-out shrink-0 shadow-xs group-hover:shadow-[0_6px_14px_-4px_rgba(0,80,205,0.5)] whitespace-nowrap"
                                >
                                  <span>Đặt lịch</span>
                                  <span
                                    className="material-symbols-outlined text-base transition-transform duration-200 ease-[cubic-bezier(0.165,0.84,0.44,1)] group-hover:translate-x-0.5 group-hover/btn:translate-x-1"
                                    aria-hidden="true"
                                  >
                                    arrow_forward
                                  </span>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {filteredServices.length > 6 && (
                    <div className="mt-10 text-center">
                      <button
                        type="button"
                        onClick={() => setShowAllServices((v) => !v)}
                        className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 rounded-xl border border-hairline-strong bg-surface-elevated hover:bg-surface-subtle text-sm font-semibold text-ink-primary transition-colors cursor-pointer"
                      >
                        <span>
                          {showAllServices
                            ? 'Thu gọn danh sách'
                            : `Xem tất cả ${filteredServices.length} dịch vụ`}
                        </span>
                        <span className="material-symbols-outlined text-lg" aria-hidden="true">
                          {showAllServices ? 'expand_less' : 'expand_more'}
                        </span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* ================= 3. 8-STEP CONCIERGE PROCESS ================= */}
      <ProcessStepperSection />

      {/* ================= 4. WORKSHOP CONTACT & RECEPTION ================= */}
      <section id="contact" className="w-full bg-surface-elevated py-10 sm:py-12 scroll-mt-16">
        <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Details (6 cols) */}
            <div className="lg:col-span-6 flex flex-col justify-between gap-6">
              <div className="max-w-xl">
                <h2 className="text-2xl sm:text-3xl font-bold text-ink-primary tracking-[-0.02em]">
                  Xưởng dịch vụ &amp; Tiếp nhận khách hàng
                </h2>
                <p className="text-sm sm:text-base text-ink-secondary mt-2 leading-relaxed">
                  Đặt lịch trước giúp cố vấn chuẩn bị sẵn khoang tiếp nhận và rút ngắn thời gian chờ
                  kiểm tra ban đầu tại xưởng.
                </p>
              </div>

              <div className="rounded-2xl bg-surface-subtle p-5 sm:p-6 divide-y divide-hairline">
                <div className="pb-4 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-surface-elevated text-accent flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl" aria-hidden="true">
                      location_on
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink-muted">Địa chỉ xưởng dịch vụ</p>
                    <p className="text-sm sm:text-base font-semibold text-ink-primary mt-0.5">
                      Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh
                    </p>
                  </div>
                </div>

                <div className="py-4 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-surface-elevated text-accent flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl" aria-hidden="true">
                      call
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink-muted">Tổng đài cố vấn</p>
                    <a
                      href="tel:19006868"
                      className="inline-block font-mono tabular-nums text-base sm:text-lg font-bold text-accent hover:underline mt-0.5"
                    >
                      1900 6868
                    </a>
                  </div>
                </div>

                <div className="pt-4 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-surface-elevated text-accent flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl" aria-hidden="true">
                      schedule
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink-muted">Giờ tiếp nhận xe</p>
                    <p className="text-sm sm:text-base text-ink-primary mt-0.5">
                      Thứ 2 – Thứ 7:{' '}
                      <span className="font-mono tabular-nums font-semibold">08:00 – 18:00</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                <Link
                  href={bookingHref}
                  className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold active:scale-[0.98] transition-all duration-150 whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-lg" aria-hidden="true">
                    calendar_add_on
                  </span>
                  <span>Đặt lịch hẹn trực tuyến</span>
                </Link>
                <button
                  type="button"
                  onClick={
                    directionsOrigin
                      ? () => {
                          setDirectionsOrigin('');
                          setGeoError('');
                        }
                      : handleUseCurrentLocation
                  }
                  disabled={locating}
                  className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl border border-hairline-strong bg-surface-elevated hover:bg-surface-subtle disabled:opacity-60 text-ink-primary text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-lg text-accent" aria-hidden="true">
                    {directionsOrigin ? 'location_on' : 'my_location'}
                  </span>
                  <span>
                    {locating
                      ? 'Đang định vị...'
                      : directionsOrigin
                      ? 'Xem lại vị trí xưởng'
                      : 'Chỉ đường trên Google Maps'}
                  </span>
                </button>
              </div>
              {geoError && (
                <p className="text-xs font-medium text-status-danger">{geoError}</p>
              )}
            </div>

            {/* Right Clean Embedded Google Maps (6 cols) */}
            <div className="lg:col-span-6">
              <SurfaceCard
                variant="elevated"
                padding="none"
                className="overflow-hidden h-full min-h-[380px] bg-surface-subtle"
              >
                <iframe
                  key={mapEmbedUrl}
                  title="Bản đồ Google Maps — Xưởng dịch vụ AutoCare Pro Khu Công Nghệ Cao, TP. Thủ Đức"
                  src={mapEmbedUrl}
                  className={
                    directionsOrigin
                      ? 'w-full h-full min-h-[380px] border-0'
                      : 'w-full h-[calc(100%+124px)] min-h-[504px] -mt-[124px] border-0'
                  }
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  suppressHydrationWarning
                  allowFullScreen
                />
              </SurfaceCard>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
