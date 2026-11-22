import type { Metadata } from 'next';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';

export const metadata: Metadata = {
  title: 'AutoCare Pro – Cổng Dịch vụ Kỹ thuật Ô tô',
  description:
    'Đặt lịch bảo dưỡng, theo dõi tiến độ sửa chữa trực tuyến, phê duyệt báo giá minh bạch và thanh toán SePay.',
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink-primary antialiased">
      <PublicHeader />
      <main className="flex-1 w-full">{children}</main>
      <PublicFooter />
    </div>
  );
}
