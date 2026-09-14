import { redirect } from 'next/navigation';

export default function Home() {
  // Tạm thời điều hướng trang chủ (/) sang trang đăng nhập (/login)
  redirect('/login');
}
