import { redirect } from 'next/navigation';

export default function Home() {
  // Trang chủ: điều hướng sang public landing page
  redirect('/home');
}

