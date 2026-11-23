import { redirect } from 'next/navigation';

export default function AppointmentsPage() {
  redirect('/customer/profile?tab=appointments');
}

