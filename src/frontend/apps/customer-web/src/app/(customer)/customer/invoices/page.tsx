import { redirect } from 'next/navigation';

export default async function CustomerInvoicesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = searchParams ? await searchParams : {};
  const params = new URLSearchParams();
  params.set('tab', 'invoices');
  for (const [key, val] of Object.entries(resolved)) {
    if (key !== 'tab' && typeof val === 'string') {
      params.set(key, val);
    }
  }
  redirect(`/customer/profile?${params.toString()}`);
}

