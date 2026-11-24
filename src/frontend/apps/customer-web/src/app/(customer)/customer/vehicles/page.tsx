import { redirect } from 'next/navigation';

export default function VehiclesPage() {
  redirect('/customer/profile?tab=vehicles');
}

