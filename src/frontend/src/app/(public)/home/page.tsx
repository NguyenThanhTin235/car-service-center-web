'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import api from '@/lib/axios';
import LogoutButton from '@/components/shared/LogoutButton';
import { getDashboardPathByRole } from '@/utils/roleRedirect';

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

const categoryIcons: Record<string, string> = {
  REPAIR: 'build',
  MAINTENANCE: 'settings',
  CAR_WASH: 'local_car_wash',
  DETAILING: 'auto_fix_high',
};

const categoryColors: Record<string, string> = {
  REPAIR: 'from-red-500 to-orange-500',
  MAINTENANCE: 'from-blue-500 to-cyan-500',
  CAR_WASH: 'from-teal-500 to-green-500',
  DETAILING: 'from-purple-500 to-pink-500',
};

const vehicleSizeLabel: Record<string, string> = {
  SMALL: 'Xe nhỏ (4 chỗ)',
  MEDIUM: 'Xe vừa (5-7 chỗ)',
  LARGE: 'Xe lớn (7+ chỗ)',
  SUV: 'SUV / CUV',
  TRUCK: 'Bán tải / Xe tải',
};

function formatPrice(price: string | number) {
  return Number(price).toLocaleString('vi-VN') + 'đ';
}

export default function HomePage() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceTemplate[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#050505]">
      {/* ===== HEADER / NAV ===== */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#0866FF] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <span className="material-symbols-outlined text-white text-[22px]">directions_car</span>
            </div>
            <div>
              <div className="font-bold text-lg text-[#050505] leading-tight">AutoCare Pro</div>
              <div className="text-xs text-[#65676B]">Dịch vụ Ô tô Thông minh</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#services" className="text-sm text-[#65676B] hover:text-[#0866FF] transition-colors font-medium">Dịch vụ</a>
            <a href="#about" className="text-sm text-[#65676B] hover:text-[#0866FF] transition-colors font-medium">Về chúng tôi</a>
            <a href="#contact" className="text-sm text-[#65676B] hover:text-[#0866FF] transition-colors font-medium">Liên hệ</a>
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Link
                  href={getDashboardPathByRole(user.roles)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#0866FF] hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">account_circle</span>
                  <span>{user.fullName || 'Tài khoản'}</span>
                </Link>
                <LogoutButton className="text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1" />
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-[#0866FF] hover:underline transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-semibold bg-[#0866FF] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Đăng ký miễn phí
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0866FF] to-blue-800 text-white">
        {/* Ambient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-cyan-400/15 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/25 text-xs font-medium mb-6">
              <span className="material-symbols-outlined text-sm">verified</span>
              <span>Trung tâm dịch vụ ô tô uy tín #1</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Chăm sóc xe<br />
              <span className="text-yellow-300">chuyên nghiệp</span>,<br />
              minh bạch & tiện lợi
            </h1>
            <p className="text-lg text-blue-100 mb-8 leading-relaxed">
              Đặt lịch bảo dưỡng, sửa chữa và chăm sóc ô tô trực tuyến. Theo dõi tiến độ sửa chữa ngay trên điện thoại — không cần phải đến tận nơi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/login"
                id="cta-login"
                className="flex items-center justify-center gap-2 bg-yellow-400 text-[#050505] font-bold px-8 py-4 rounded-xl hover:bg-yellow-300 transition-colors shadow-lg text-base"
              >
                <span className="material-symbols-outlined">calendar_month</span>
                Đặt lịch ngay
              </Link>
              <a
                href="#services"
                className="flex items-center justify-center gap-2 bg-white/15 border border-white/30 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/25 transition-colors text-base"
              >
                <span className="material-symbols-outlined">arrow_downward</span>
                Xem dịch vụ
              </a>
            </div>
          </div>
          {/* Stats */}
          <div className="flex flex-wrap gap-8 mt-14">
            {[
              { value: '5,000+', label: 'Xe đã phục vụ' },
              { value: '98%', label: 'Khách hàng hài lòng' },
              { value: '10 năm', label: 'Kinh nghiệm' },
              { value: '15 phút', label: 'Thời gian phản hồi' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-extrabold">{stat.value}</div>
                <div className="text-blue-200 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SERVICE CATEGORIES ===== */}
      <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-[#050505] mb-3">Danh mục dịch vụ</h2>
          <p className="text-[#65676B] text-base">Chọn nhóm dịch vụ phù hợp với nhu cầu của bạn</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#0866FF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Category filter tabs */}
            <div className="flex flex-wrap gap-3 justify-center mb-10">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${activeCategory === null
                  ? 'bg-[#0866FF] text-white shadow-md'
                  : 'bg-white text-[#65676B] hover:bg-gray-100 border border-gray-200'
                  }`}
              >
                Tất cả ({services.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${activeCategory === cat.id
                    ? 'bg-[#0866FF] text-white shadow-md'
                    : 'bg-white text-[#65676B] hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {categoryIcons[cat.name] || 'car_repair'}
                  </span>
                  {cat.name} ({cat._count.templates})
                </button>
              ))}
            </div>

            {/* Service cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((svc) => (
                <div
                  key={svc.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                >
                  {/* Card header gradient */}
                  <div className={`h-2 bg-gradient-to-r ${categoryColors[svc.category.name] || 'from-gray-400 to-gray-600'}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-xs font-semibold text-[#65676B] bg-[#F0F2F5] px-2 py-0.5 rounded-full">
                          {svc.category.name}
                        </span>
                        <h3 className="text-base font-bold text-[#050505] mt-2 leading-tight">{svc.name}</h3>
                      </div>
                      <span className="material-symbols-outlined text-[#0866FF] text-2xl ml-2 flex-shrink-0">
                        {categoryIcons[svc.category.name] || 'car_repair'}
                      </span>
                    </div>

                    {svc.description && (
                      <p className="text-sm text-[#65676B] mb-4 line-clamp-2 leading-relaxed">{svc.description}</p>
                    )}

                    {/* Pricing info */}
                    <div className="border-t border-gray-100 pt-3">
                      {svc.pricingType === 'FIXED' && svc.fixedPrice && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#65676B]">Giá tham khảo</span>
                          <span className="text-base font-bold text-[#0866FF]">{formatPrice(svc.fixedPrice)}</span>
                        </div>
                      )}
                      {svc.pricingType === 'VEHICLE_SIZE' && svc.sizePrices.length > 0 && (
                        <div>
                          <span className="text-xs text-[#65676B] block mb-1.5">Giá theo loại xe</span>
                          <div className="space-y-1">
                            {svc.sizePrices.slice(0, 3).map((sp) => (
                              <div key={sp.vehicleSize} className="flex justify-between text-xs">
                                <span className="text-[#65676B]">{vehicleSizeLabel[sp.vehicleSize] || sp.vehicleSize}</span>
                                <span className="font-semibold text-[#050505]">{formatPrice(sp.price)}</span>
                              </div>
                            ))}
                            {svc.sizePrices.length > 3 && (
                              <div className="text-xs text-[#0866FF]">+{svc.sizePrices.length - 3} loại xe khác...</div>
                            )}
                          </div>
                        </div>
                      )}
                      {svc.pricingType === 'LABOUR_PARTS' && (
                        <div className="flex items-center gap-1.5 text-xs text-[#65676B]">
                          <span className="material-symbols-outlined text-sm text-[#0866FF]">info</span>
                          Giá theo nhân công & phụ tùng thực tế
                        </div>
                      )}
                    </div>

                    <Link
                      href="/login"
                      className="mt-4 w-full flex items-center justify-center gap-1.5 bg-[#0866FF] text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">calendar_month</span>
                      Đặt lịch ngay
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {filteredServices.length === 0 && (
              <div className="text-center py-16 text-[#65676B]">
                <span className="material-symbols-outlined text-5xl text-gray-300 block mb-3">search_off</span>
                Không có dịch vụ nào trong danh mục này.
              </div>
            )}
          </>
        )}
      </section>

      {/* ===== CTA SECTION ===== */}
      <section id="about" className="bg-[#0866FF] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold mb-4">Sẵn sàng trải nghiệm dịch vụ?</h2>
          <p className="text-blue-100 text-lg mb-8">
            Đăng ký tài khoản miễn phí, đặt lịch và theo dõi tình trạng xe của bạn mọi lúc, mọi nơi.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 bg-yellow-400 text-[#050505] font-bold px-8 py-4 rounded-xl hover:bg-yellow-300 transition-colors shadow-lg"
            >
              <span className="material-symbols-outlined">person_add</span>
              Tạo tài khoản miễn phí
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 bg-white/15 border border-white/30 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/25 transition-colors"
            >
              <span className="material-symbols-outlined">login</span>
              Đăng nhập
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer id="contact" className="bg-[#050505] text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[#0866FF] text-2xl">directions_car</span>
                <span className="font-bold text-lg">AutoCare Pro</span>
              </div>
              <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
                Hệ thống quản lý trung tâm dịch vụ ô tô chuyên nghiệp, minh bạch và tiện lợi.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-sm mb-3 text-gray-300">Dịch vụ</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>Sửa chữa xe</li>
                  <li>Bảo dưỡng định kỳ</li>
                  <li>Rửa xe & Detailing</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-3 text-gray-300">Liên hệ</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>📞 Hotline: 1900 6868</li>
                  <li>📧 info@autocaepro.vn</li>
                  <li>📍 TP. Hồ Chí Minh</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <span>© 2025 AutoCare Pro Service Center. Bản quyền được bảo lưu.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a>
              <a href="#" className="hover:text-white transition-colors">Điều khoản sử dụng</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
