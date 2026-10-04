'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';

interface ServiceCategory {
  id: number;
  name: string;
  description: string | null;
  _count: { templates: number };
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

// Map service names/categories to specific icons
const getServiceIcon = (name: string, catName: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('bảo dưỡng') || lower.includes('nhớt')) return 'build';
  if (lower.includes('động cơ') || lower.includes('hộp số')) return 'settings';
  if (lower.includes('nội thất') || lower.includes('ngoại thất')) return 'auto_awesome';
  if (lower.includes('phanh') || lower.includes('lốp')) return 'tire_repair';
  if (lower.includes('điện') || lower.includes('điều hòa')) return 'ac_unit';
  if (lower.includes('cứu hộ') || lower.includes('bảo hiểm')) return 'shield';
  
  // Default icons based on category name
  if (catName.includes('REPAIR')) return 'build';
  if (catName.includes('MAINTENANCE')) return 'settings';
  if (catName.includes('WASH')) return 'local_car_wash';
  if (catName.includes('DETAIL')) return 'auto_fix_high';
  return 'construction';
};

function formatPrice(price: string | number) {
  return Number(price).toLocaleString('vi-VN') + 'đ';
}

export default function HomePage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceTemplate[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllServices, setShowAllServices] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, svcRes] = await Promise.all([
          api.get('/api/public/categories'),
          api.get('/api/public/services'),
        ]);
        setCategories(catRes.data.data);
        setServices(svcRes.data.data);
      } catch (err) {
        console.error('Failed to load services', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredServices = activeCategory
    ? services.filter((s) => s.category.id === activeCategory)
    : services;

  const servicesToDisplay = showAllServices ? filteredServices : filteredServices.slice(0, 6);

  return (
    <>
      {/* ================= 1. HERO SECTION ================= */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#0866FF] via-[#0050CD] to-[#0A2540] text-on-primary py-space-4xl lg:py-24">
        {/* Ambient Graphic Vector Pattern Overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div className="absolute -right-24 -bottom-24 w-96 h-96 bg-primary-container/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative w-full max-w-container-max mx-auto px-gutter-desktop">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Copy & Actions */}
            <div className="lg:col-span-7 flex flex-col items-start gap-6">
              {/* Quality Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-lowest/15 backdrop-blur-md border border-surface-container-lowest/25 text-on-primary font-label-md text-label-md">
                <span className="material-symbols-outlined text-sm text-primary-fixed" data-icon="verified">verified</span>
                <span>DỊCH VỤ Ô TÔ CHUẨN QUỐC TẾ TẠI VIỆT NAM</span>
              </div>
              
              {/* Headline */}
              <h1 className="font-headline-xl text-headline-xl lg:text-[44px] lg:leading-[52px] font-bold text-on-primary tracking-tight max-w-2xl">
                Chào mừng đến với Car Service Center
              </h1>
              
              {/* Subtitle */}
              <p className="font-body-lg text-body-lg text-primary-fixed max-w-xl">
                Trung tâm chăm sóc & sửa chữa ô tô tiêu chuẩn 5 sao. Cam kết phụ tùng chính hãng, quy trình kỹ thuật minh bạch và kỹ thuật viên giàu kinh nghiệm.
              </p>
              
              {/* CTA Cluster */}
              <div className="flex flex-wrap items-center gap-4 pt-2 w-full sm:w-auto">
                <Link className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-surface-container-lowest text-primary-container font-label-lg text-label-lg rounded-xl shadow-md hover:bg-surface-container-low transition-all duration-150 active:scale-[0.98]" href="/login">
                  <span>Đặt lịch ngay</span>
                  <span className="material-symbols-outlined text-lg" data-icon="arrow_forward">arrow_forward</span>
                </Link>
                <Link className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 border border-surface-container-lowest/30 text-on-primary font-label-lg text-label-lg rounded-xl backdrop-blur-sm transition-all duration-150 active:scale-[0.98]" href="/login">
                  <span className="material-symbols-outlined text-lg" data-icon="search">search</span>
                  <span>Tra cứu bảo dưỡng</span>
                </Link>
              </div>
              
              {/* Stats Row */}
              <div className="w-full pt-8 mt-4 border-t border-surface-container-lowest/20 grid grid-cols-3 gap-4">
                <div>
                  <div className="font-headline-lg text-headline-lg font-bold text-on-primary">15,000+</div>
                  <div className="font-body-sm text-body-sm text-primary-fixed">Khách hàng tin tưởng</div>
                </div>
                <div>
                  <div className="font-headline-lg text-headline-lg font-bold text-on-primary">99.2%</div>
                  <div className="font-body-sm text-body-sm text-primary-fixed">Hài lòng dịch vụ</div>
                </div>
                <div>
                  <div className="font-headline-lg text-headline-lg font-bold text-on-primary">24/7</div>
                  <div className="font-body-sm text-body-sm text-primary-fixed">Cứu hộ khẩn cấp</div>
                </div>
              </div>
            </div>
            
            {/* Right Column: Interactive Featured Card / Visual Presentation */}
            <div className="lg:col-span-5 relative">
              <div className="bg-surface-container-lowest text-on-surface rounded-2xl p-6 shadow-2xl border border-surface-container-highest">
                <div className="flex items-center justify-between pb-4 border-b border-surface-container-highest">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-tertiary"></span>
                    <span className="font-label-lg text-label-lg text-on-surface">Khoang dịch vụ trực tuyến</span>
                  </div>
                  {/* Vietnamese License Plate Pill */}
                  <span className="px-2.5 py-0.5 border border-outline font-mono text-label-sm font-bold tracking-wider rounded bg-surface-container-low text-on-surface">
                    30F-982.51
                  </span>
                </div>
                
                {/* Vehicle visual thumbnail placeholder */}
                <div className="mt-4 rounded-xl overflow-hidden relative aspect-video bg-surface-container">
                  <img alt="Xe đang kiểm tra trong xưởng" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJkp62zUm5TCTHBFYaGj9mwYKWdiXwABn_QhQf8HyTZhOOuX3lcLueZ5vl2Dr6fAGCMjq3-5Z_nOjMS8S9UAVf8LtsSYxkLWDIU27BPOSE8NBO0Fdxyrs7-qGBiFmP2_w7vNZMoN0elJssY88f4AilBGtI9pU7OZ_BX_QPZT6emogXsVhCNX3OS5v6yJP5tnziE4l_1NvtU8v9qWBVcQWuwhgwuMUUC51uRnOVq42Wf64sGOMsPB-6"/>
                  <div className="absolute bottom-3 left-3 bg-inverse-surface/85 backdrop-blur-md px-3 py-1 rounded-full text-on-primary font-label-sm text-label-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse"></span>
                    <span>Đang thực hiện: Kiểm tra 30 hạng mục</span>
                  </div>
                </div>
                
                {/* Live Progress Timeline Tracker */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-label-md text-label-md text-on-surface-variant">Tiến độ công việc</span>
                    <span className="font-label-md text-label-md text-primary font-bold">65% Hoàn tất</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-primary-container h-full rounded-full transition-all duration-500" style={{ width: '65%' }}></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="p-2 rounded-lg bg-surface-container-low">
                      <span className="material-symbols-outlined text-tertiary text-sm" data-icon="check_circle">check_circle</span>
                      <p className="font-label-sm text-label-sm text-on-surface mt-1">Tiếp nhận xe</p>
                    </div>
                    <div className="p-2 rounded-lg bg-primary-fixed/30 border border-primary-fixed">
                      <span className="material-symbols-outlined text-primary-container text-sm" data-icon="pending">pending</span>
                      <p className="font-label-sm text-label-sm text-primary-container font-semibold mt-1">Bảo dưỡng</p>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-container-low opacity-60">
                      <span className="material-symbols-outlined text-outline text-sm" data-icon="schedule">schedule</span>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Rửa xe & Giao</p>
                    </div>
                  </div>
                </div>
                
                {/* Technician cardlet */}
                <div className="mt-5 pt-4 border-t border-surface-container-highest flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold font-label-sm">
                      KTV
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">KTV. Trần Hoàng Long</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Chuyên viên Động cơ & Khung gầm</p>
                    </div>
                  </div>
                  <button className="text-primary-container font-label-md text-label-md hover:underline" type="button">Xem camera</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 2. SERVICES SECTION ================= */}
      <section className="w-full py-space-4xl bg-surface" id="services">
        <div className="w-full max-w-container-max mx-auto px-gutter-desktop">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary font-label-md text-label-md uppercase tracking-wider mb-3">
              <span className="material-symbols-outlined text-base" data-icon="construction">construction</span>
              <span>Dịch vụ chuyên nghiệp</span>
            </div>
            <h2 className="font-headline-xl text-headline-xl text-on-surface font-bold">Dịch vụ của chúng tôi</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
              Giải pháp chăm sóc toàn diện cho xế cưng của bạn với tiêu chuẩn chất lượng cao nhất và trang thiết bị hiện đại.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary-container border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Category Filter Tabs */}
              <div className="flex flex-wrap gap-3 justify-center mb-10">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    activeCategory === null
                      ? 'bg-primary-container text-on-primary shadow-md'
                      : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low border border-surface-container-highest'
                  }`}
                >
                  Tất cả ({services.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                      activeCategory === cat.id
                        ? 'bg-primary-container text-on-primary shadow-md'
                        : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low border border-surface-container-highest'
                    }`}
                  >
                    {cat.name} ({cat._count.templates})
                  </button>
                ))}
              </div>

              {/* 3-Column Bento/Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {servicesToDisplay.map((svc) => {
                  const iconName = getServiceIcon(svc.name, svc.category.name);
                  
                  // Determine best price to show
                  let priceDisplay = 'Liên hệ';
                  if (svc.pricingType === 'FIXED' && svc.fixedPrice) {
                    priceDisplay = `Từ ${formatPrice(svc.fixedPrice)}`;
                  } else if (svc.pricingType === 'VEHICLE_SIZE' && svc.sizePrices.length > 0) {
                    const lowestPrice = Math.min(...svc.sizePrices.map(sp => Number(sp.price)));
                    priceDisplay = `Từ ${formatPrice(lowestPrice)}`;
                  } else if (svc.pricingType === 'LABOUR_PARTS') {
                    priceDisplay = 'Báo giá minh bạch';
                  }

                  return (
                    <div key={svc.id} className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary-container flex flex-col justify-between">
                      <div>
                        <div className="w-12 h-12 rounded-xl bg-primary-fixed text-primary-container flex items-center justify-center mb-5">
                          <span className="material-symbols-outlined text-2xl" data-icon={iconName}>{iconName}</span>
                        </div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-2">{svc.name}</h3>
                        <p className="font-body-md text-body-md text-on-surface-variant line-clamp-3">
                          {svc.description || 'Dịch vụ chăm sóc và bảo dưỡng chuyên nghiệp.'}
                        </p>
                      </div>
                      <div className="pt-6 mt-6 border-t border-surface-container-highest flex items-center justify-between">
                        <span className={`font-label-md text-label-md px-2.5 py-1 rounded-full font-bold ${
                          priceDisplay.includes('Liên hệ') 
                            ? 'bg-tertiary/10 text-tertiary' 
                            : 'bg-surface-container text-primary'
                        }`}>
                          {priceDisplay}
                        </span>
                        <Link className="inline-flex items-center gap-1 text-primary font-label-md text-label-md hover:text-primary-container font-semibold" href="/login">
                          <span>Chi tiết</span>
                          <span className="material-symbols-outlined text-sm" data-icon="chevron_right">chevron_right</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredServices.length > 6 && (
                <div className="mt-12 text-center">
                  <button
                    onClick={() => setShowAllServices(!showAllServices)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-surface-container-lowest text-on-surface font-label-lg text-label-lg rounded-xl shadow-sm hover:bg-surface-container-low transition-all duration-150 active:scale-[0.98] border border-surface-container-highest"
                  >
                    <span>{showAllServices ? 'Thu gọn' : 'Xem tất cả dịch vụ'}</span>
                    <span className="material-symbols-outlined text-lg">
                      {showAllServices ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </div>
              )}

              {filteredServices.length === 0 && (
                <div className="text-center py-16 text-on-surface-variant">
                  <span className="material-symbols-outlined text-5xl text-outline-variant block mb-3">search_off</span>
                  Không có dịch vụ nào trong danh mục này.
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ================= 3. CONTACT & GARAGE INFO ================= */}
      <section className="w-full py-space-4xl bg-surface-container-low border-t border-surface-container-highest" id="contact">
        <div className="w-full max-w-container-max mx-auto px-gutter-desktop">
          {/* Header */}
          <div className="text-left max-w-2xl mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md mb-2">
              <span className="material-symbols-outlined text-base" data-icon="pin_drop">pin_drop</span>
              <span>MẠNG LƯỚI TOÀN QUỐC</span>
            </div>
            <h2 className="font-headline-xl text-headline-xl text-on-surface font-bold">Liên hệ với chúng tôi</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
              Hệ thống garage Car Service Center luôn sẵn sàng phục vụ quý khách với trang bị xưởng hiện đại nhất.
            </p>
          </div>
          
          {/* 2-Column Contact & Map Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left: Styled Map Container with Map Placeholder */}
            <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl border border-surface-container-highest overflow-hidden shadow-sm flex flex-col">
              {/* Map Preview Frame */}
              <div className="relative w-full flex-1 min-h-[340px] bg-surface-container" data-location="Hanoi">
                <img alt="Bản đồ chỉ đường Car Service Center Chi nhánh Thăng Long" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCN00fpd-hov_Pi-8ZECMCMQ_hzfemer0-f-WIlecA0pg1KrofW546Sbymx52djJpHedSM-viMmJT4Icgv-6zR42n_frakb1odyS2pveuxvsN2Ziooqkrn76XfgX7lCoHXxDKER-_42DozJ5W7bpsq9Todom8XNKpivYVV7Ry5fa_x5EQ5-IRazBw_5xcNdPBswjsHupWqq8H_Vx-5JTrMcr4nDXJPq9uscoSFuDJoMgAK006BsdKY3"/>
                {/* Custom Map Card Pin Overlay */}
                <div className="absolute top-6 left-6 bg-surface-container-lowest/95 backdrop-blur-md p-3.5 rounded-xl border border-surface-container-highest shadow-md max-w-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-base" data-icon="location_on">location_on</span>
                    </div>
                    <div>
                      <h4 className="font-label-lg text-label-lg font-bold text-on-surface">Chi nhánh Thăng Long</h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug mt-0.5">Số 168 Đại Lộ Thăng Long, Nam Từ Liêm, Hà Nội</p>
                      <span className="inline-block mt-2 font-label-sm text-label-sm text-tertiary font-medium">● Đang mở cửa đón khách</span>
                    </div>
                  </div>
                </div>
                {/* Map Utility Controls */}
                <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                  <button className="w-9 h-9 rounded-lg bg-surface-container-lowest shadow-md flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors" type="button">
                    <span className="material-symbols-outlined text-lg" data-icon="layers">layers</span>
                  </button>
                  <button className="w-9 h-9 rounded-lg bg-surface-container-lowest shadow-md flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors" type="button">
                    <span className="material-symbols-outlined text-lg" data-icon="my_location">my_location</span>
                  </button>
                </div>
              </div>
              {/* Map Action Bottom Bar */}
              <div className="p-4 bg-surface-container-lowest border-t border-surface-container-highest flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" data-icon="navigation">navigation</span>
                  <span className="font-label-md text-label-md text-on-surface">Khoảng cách: 2.4 km (Ước tính 6 phút lái xe)</span>
                </div>
                <a className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md rounded-lg transition-colors" href="https://maps.google.com" rel="noopener noreferrer" target="_blank">
                  <span>Xem chỉ đường trên Google Maps</span>
                  <span className="material-symbols-outlined text-sm" data-icon="open_in_new">open_in_new</span>
                </a>
              </div>
            </div>
            
            {/* Right: Detailed Information Card */}
            <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl border border-surface-container-highest p-8 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold pb-4 border-b border-surface-container-highest">
                  Thông tin dịch vụ & Tiếp nhận xe
                </h3>
                <div className="mt-6 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined" data-icon="location_city">location_city</span>
                    </div>
                    <div>
                      <h4 className="font-label-md text-label-md text-on-surface-variant">Địa chỉ Garage</h4>
                      <p className="font-body-md text-body-md text-on-surface font-medium mt-0.5">Số 168 Đại Lộ Thăng Long, Nam Từ Liêm, Hà Nội</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined" data-icon="phone_in_talk">phone_in_talk</span>
                    </div>
                    <div>
                      <h4 className="font-label-md text-label-md text-on-surface-variant">Hotline hỗ trợ & Cứu hộ</h4>
                      <p className="font-body-md text-body-md text-on-surface font-semibold mt-0.5">1900 6868 • 0988 123 456</p>
                      <p className="font-label-sm text-label-sm text-tertiary">Tổng đài viên trực 24/7</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined" data-icon="mail">mail</span>
                    </div>
                    <div>
                      <h4 className="font-label-md text-label-md text-on-surface-variant">Email tiếp nhận yêu cầu</h4>
                      <p className="font-body-md text-body-md text-on-surface font-medium mt-0.5">cskh@carservicecenter.vn</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined" data-icon="timer">timer</span>
                    </div>
                    <div>
                      <h4 className="font-label-md text-label-md text-on-surface-variant">Giờ làm việc tiếp nhận xe</h4>
                      <div className="font-body-md text-body-md text-on-surface mt-0.5">
                        <p><span className="font-medium">Thứ 2 - Thứ 7:</span> 07:30 - 18:00</p>
                        <p><span className="font-medium">Chủ Nhật:</span> 08:00 - 16:30</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-surface-container-highest grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary-container text-on-primary-container font-label-lg text-label-lg rounded-xl shadow-sm hover:opacity-95 transition-all duration-150 active:scale-[0.98]" href="tel:19006868">
                  <span className="material-symbols-outlined text-lg" data-icon="call">call</span>
                  <span>Gọi tư vấn trực tiếp</span>
                </a>
                <a className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-surface-container-lowest border border-surface-container-highest hover:bg-surface-container-low text-on-surface font-label-lg text-label-lg rounded-xl transition-all duration-150 active:scale-[0.98]" href="#contact">
                  <span className="material-symbols-outlined text-lg" data-icon="send">send</span>
                  <span>Gửi yêu cầu hỗ trợ</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
