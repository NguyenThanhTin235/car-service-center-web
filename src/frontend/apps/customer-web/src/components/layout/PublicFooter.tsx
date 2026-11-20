import React from 'react';
import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer className="w-full hero-banner-surface text-white no-print">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-6 gap-y-8 lg:gap-10 pb-8 sm:pb-10 border-b border-white/15">
          {/* Brand Column (full width on mobile/tablet, 4 cols on desktop) */}
          <div className="col-span-2 lg:col-span-4 space-y-3 sm:space-y-4">
            <Link href="/home" className="inline-flex items-center gap-2.5 min-h-[44px]">
              <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl" aria-hidden="true">
                  directions_car
                </span>
              </div>
              <span className="font-bold text-base tracking-[-0.02em] text-white">
                AutoCare Pro
              </span>
            </Link>
            <p className="text-sm text-white/75 leading-relaxed max-w-sm">
              Cổng dịch vụ kỹ thuật ô tô giúp chủ xe đặt lịch bảo dưỡng, theo dõi tiến độ sửa
              chữa trực tuyến, phê duyệt báo giá minh bạch và thanh toán qua SePay.
            </p>
            <div className="pt-1 flex items-center gap-2 text-xs text-white/75">
              <span
                className="material-symbols-outlined text-base leading-none text-white/90 shrink-0"
                aria-hidden="true"
              >
                location_on
              </span>
              <span className="leading-relaxed">
                Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh
              </span>
            </div>
          </div>

          {/* Explore Links (1 col on mobile/tablet side-by-side, 2 cols on desktop) */}
          <div className="col-span-1 lg:col-span-2 space-y-2.5 sm:space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-white/60">
              Khám phá
            </h3>
            <ul className="space-y-0.5 text-sm">
              <li>
                <Link
                  href="/home"
                  className="inline-flex items-center min-h-[36px] text-white/85 hover:text-white transition-colors"
                >
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link
                  href="/home#services"
                  className="inline-flex items-center min-h-[36px] text-white/85 hover:text-white transition-colors"
                >
                  Danh mục dịch vụ
                </Link>
              </li>
              <li>
                <Link
                  href="/home#process"
                  className="inline-flex items-center min-h-[36px] text-white/85 hover:text-white transition-colors"
                >
                  Quy trình 8 bước
                </Link>
              </li>
              <li>
                <Link
                  href="/home#contact"
                  className="inline-flex items-center min-h-[36px] text-white/85 hover:text-white transition-colors"
                >
                  Liên hệ xưởng
                </Link>
              </li>
            </ul>
          </div>

          {/* Portal Links (1 col on mobile/tablet side-by-side, 3 cols on desktop) */}
          <div className="col-span-1 lg:col-span-3 space-y-2.5 sm:space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-white/60">
              Cổng khách hàng
            </h3>
            <ul className="space-y-0.5 text-sm">
              <li>
                <Link
                  href="/customer"
                  className="inline-flex items-center min-h-[36px] text-white/85 hover:text-white transition-colors"
                >
                  Tổng quan tài khoản
                </Link>
              </li>
              <li>
                <Link
                  href="/customer/appointments"
                  className="inline-flex items-center min-h-[36px] text-white/85 hover:text-white transition-colors"
                >
                  Đặt lịch bảo dưỡng
                </Link>
              </li>
              <li>
                <Link
                  href="/customer/tracking"
                  className="inline-flex items-center min-h-[36px] text-white/85 hover:text-white transition-colors"
                >
                  Theo dõi tiến độ
                </Link>
              </li>
              <li>
                <Link
                  href="/customer/invoices"
                  className="inline-flex items-center min-h-[36px] text-white/85 hover:text-white transition-colors"
                >
                  Hóa đơn &amp; SePay
                </Link>
              </li>
              <li>
                <Link
                  href="/customer/history"
                  className="inline-flex items-center min-h-[36px] text-white/85 hover:text-white transition-colors"
                >
                  Lịch sử bảo dưỡng
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Hotline Card (full width on mobile/tablet, 3 cols on desktop) */}
          <div className="col-span-2 lg:col-span-3">
            <div className="rounded-2xl bg-white/10 border border-white/15 p-4 sm:p-5 space-y-3">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">Tổng đài cố vấn</h3>
                <p className="text-xs text-white/75">
                  Thứ 2 – Thứ 7:{' '}
                  <span className="font-mono tabular-nums font-semibold text-white">
                    08:00 – 18:00
                  </span>
                </p>
              </div>
              <a
                href="tel:19006868"
                className="inline-flex items-center gap-2 min-h-[44px] font-mono tabular-nums text-2xl font-bold text-white hover:text-accent-soft transition-colors"
              >
                <span className="material-symbols-outlined text-2xl" aria-hidden="true">
                  call
                </span>
                <span>1900 6868</span>
              </a>
              <div className="pt-2 border-t border-white/15">
                <Link
                  href="/home#contact"
                  className="inline-flex items-center gap-1.5 min-h-[36px] text-xs font-semibold text-white/90 hover:text-white transition-colors"
                >
                  <span>Xem bản đồ &amp; chỉ đường</span>
                  <span className="material-symbols-outlined text-base" aria-hidden="true">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Row */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/65">
          <p className="text-center sm:text-left">
            © 2026 AutoCare Pro. Trung tâm Dịch vụ Kỹ thuật Ô tô.
          </p>
          <p className="text-center sm:text-right">
            Thanh toán chuyển khoản SePay · Hóa đơn chuẩn 0% VAT
          </p>
        </div>
      </div>
    </footer>
  );
}
