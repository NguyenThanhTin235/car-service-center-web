import React from 'react';
import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer className="w-full bottom-0 bg-surface-container-lowest border-t border-surface-container-highest">
      <div className="w-full max-w-container-max mx-auto px-gutter-desktop py-space-3xl">
        {/* Top Brand & Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          {/* Brand Identity Column */}
          <div className="md:col-span-5 flex flex-col items-start gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-xl" data-icon="directions_car">directions_car</span>
              </div>
              <span className="font-headline-md text-headline-md text-on-surface font-bold">Car Service Center</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
              Hệ thống trung tâm dịch vụ kỹ thuật và chăm sóc ô tô toàn diện hàng đầu. Đảm bảo an toàn trên mọi hành trình của bạn.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <div className="px-3 py-1 rounded-md bg-surface-container border border-surface-container-highest font-label-sm text-label-sm text-on-surface font-semibold">
                ISO 9001:2015
              </div>
              <div className="px-3 py-1 rounded-md bg-surface-container border border-surface-container-highest font-label-sm text-label-sm text-on-surface font-semibold">
                Bảo hành chuẩn hãng
              </div>
            </div>
          </div>
          
          {/* Links Columns */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-4">Chính sách & Quy chuẩn</h4>
              <ul className="space-y-3 font-body-sm text-body-sm">
                <li>
                  <a className="text-on-surface-variant hover:text-primary-container transition-colors duration-150" href="#">Chính sách bảo hành</a>
                </li>
                <li>
                  <a className="text-on-surface-variant hover:text-primary-container transition-colors duration-150" href="#">Quy chuẩn bảo dưỡng</a>
                </li>
                <li>
                  <a className="text-on-surface-variant hover:text-primary-container transition-colors duration-150" href="#">Điều khoản dịch vụ</a>
                </li>
                <li>
                  <a className="text-on-surface-variant hover:text-primary-container transition-colors duration-150" href="#">Bảo mật thông tin khách hàng</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-4">Cổng khách hàng</h4>
              <ul className="space-y-3 font-body-sm text-body-sm">
                <li>
                  <a className="text-on-surface-variant hover:text-primary-container transition-colors duration-150" href="#">Tra cứu sổ bảo hành điện tử</a>
                </li>
                <li>
                  <a className="text-on-surface-variant hover:text-primary-container transition-colors duration-150" href="#">Lịch sử sửa chữa & Phụ tùng</a>
                </li>
                <li>
                  <a className="text-on-surface-variant hover:text-primary-container transition-colors duration-150" href="#">Tích điểm hội viên VIP</a>
                </li>
                <li>
                  <a className="text-on-surface-variant hover:text-primary-container transition-colors duration-150" href="#">Yêu cầu cứu hộ khẩn cấp</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-4">Hỗ trợ khẩn cấp</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-2">Đội ngũ kỹ thuật túc trực 24/7 trên tất cả các tuyến đường cao tốc.</p>
              <a className="font-headline-md text-headline-md font-bold text-primary-container tracking-tight block" href="tel:19006868">
                1900 6868
              </a>
            </div>
          </div>
        </div>
        
        {/* Bottom Copyright Row */}
        <div className="pt-8 border-t border-surface-container-highest flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body-sm text-body-sm text-on-surface-variant text-center sm:text-left">
            © 2025 Car Service Center. Bản quyền thuộc về Trung tâm Dịch vụ Kỹ thuật Ô tô.
          </p>
          <div className="flex items-center gap-6 text-on-surface-variant font-label-md text-label-md">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
              Hệ thống máy chủ hoạt động 100%
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
