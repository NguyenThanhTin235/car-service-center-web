import { redirect } from 'next/navigation';

export default function Home() {
  // Trang chủ internal: điều hướng sang trang đăng nhập
  redirect('/login');
}

