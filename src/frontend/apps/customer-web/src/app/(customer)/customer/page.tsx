import { redirect } from 'next/navigation';

export default function CustomerDashboardRedirectPage() {
  redirect('/customer/profile?tab=overview');
}
