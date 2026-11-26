'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { usePathname } from 'next/navigation';

export default function WebVitalsReporter({ appName }: { appName: 'customer-web' | 'internal-web' }) {
  const pathname = usePathname();

  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!['LCP', 'INP', 'CLS', 'FCP', 'TTFB'].includes(metric.name)) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    const url = `${apiBase}/api/public/web-vitals`;
    const body = JSON.stringify({
      app: appName,
      path: pathname || '/',
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
    });

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    }
  });

  return null;
}
