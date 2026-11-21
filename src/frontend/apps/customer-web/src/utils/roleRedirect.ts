export const getDashboardPathByRole = (roles: string[]): string => {
  if (!roles || !Array.isArray(roles) || roles.length === 0) return '/login';

  // On customer-web, redirect authenticated customers to /home
  if (roles.includes('CUSTOMER')) return '/home';

  // If pure staff account, route to the internal-web management portal
  const internalBaseUrl = (
    process.env.NEXT_PUBLIC_INTERNAL_URL || 'http://localhost:3001'
  ).replace(/\/+$/, '');
  if (roles.includes('ADMIN')) return `${internalBaseUrl}/accounts`;
  if (roles.includes('MANAGER')) return `${internalBaseUrl}/inventory`;
  if (roles.includes('DESK STAFF')) return `${internalBaseUrl}/staff/appointments`;
  if (roles.includes('SA')) return `${internalBaseUrl}/advisor`;

  return '/home';
};
