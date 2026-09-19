import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AutoCare Pro – Hệ thống Dịch vụ Ô tô Thông minh',
  description: 'Đặt lịch bảo dưỡng, sửa chữa, rửa xe và chăm sóc ô tô chuyên nghiệp. Theo dõi tiến độ sửa chữa trực tuyến.',
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
