import HomeClient from './HomeClient';

export const revalidate = 60;

async function fetchPublicCatalog() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
  try {
    const [catRes, svcRes] = await Promise.all([
      fetch(`${apiBase}/api/public/categories`, {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(2000),
      }),
      fetch(`${apiBase}/api/public/services`, {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(2000),
      }),
    ]);

    if (!catRes.ok || !svcRes.ok) {
      return { categories: [], services: [], serverLoaded: false };
    }

    const [catJson, svcJson] = await Promise.all([catRes.json(), svcRes.json()]);
    return {
      categories: Array.isArray(catJson?.data) ? catJson.data : [],
      services: Array.isArray(svcJson?.data) ? svcJson.data : [],
      serverLoaded: true,
    };
  } catch {
    return { categories: [], services: [], serverLoaded: false };
  }
}

export default async function HomePage() {
  const { categories, services, serverLoaded } = await fetchPublicCatalog();
  return (
    <HomeClient
      initialCategories={categories}
      initialServices={services}
      serverLoaded={serverLoaded}
    />
  );
}
