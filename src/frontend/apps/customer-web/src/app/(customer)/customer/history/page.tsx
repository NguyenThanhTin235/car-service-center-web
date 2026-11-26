import { redirect } from 'next/navigation';

export default function CustomerHistoryPage() {
  redirect('/customer/profile?tab=history');
}


