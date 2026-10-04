import type { Metadata } from 'next';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';

export const metadata: Metadata = {
  title: 'AutoCare Pro – Hệ thống Dịch vụ Ô tô Thông minh',
  description: 'Đặt lịch bảo dưỡng, sửa chữa, rửa xe và chăm sóc ô tô chuyên nghiệp. Theo dõi tiến độ sửa chữa trực tuyến.',
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />
      <main className="flex-1 w-full">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
