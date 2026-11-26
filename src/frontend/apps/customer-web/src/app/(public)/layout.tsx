import type { Metadata } from 'next';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import LazyCustomerAiChatWidget from '@/components/chat/LazyCustomerAiChatWidget';

export const metadata: Metadata = {
  title: 'AutoCare Pro – Cổng Dịch vụ Kỹ thuật Ô tô',
  description:
    'Đặt lịch bảo dưỡng, theo dõi tiến độ sửa chữa trực tuyến, phê duyệt báo giá minh bạch và thanh toán SePay.',
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink-primary antialiased overflow-x-clip">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow-lg"
      >
        Chuyển đến nội dung chính
      </a>
      <PublicHeader />
      <main id="main-content" className="flex-1 w-full">{children}</main>
      <PublicFooter />
      <LazyCustomerAiChatWidget />
    </div>
  );
}
