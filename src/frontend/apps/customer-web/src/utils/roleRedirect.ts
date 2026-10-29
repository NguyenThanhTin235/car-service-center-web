export const getDashboardPathByRole = (roles: string[]): string => {
  if (!roles || !Array.isArray(roles) || roles.length === 0) return '/login';

  // On customer-web, always prioritize customer profile
  if (roles.includes('CUSTOMER')) return '/customer/profile';

  // If pure staff account, route to the internal-web management portal
  if (roles.includes('ADMIN')) return 'http://localhost:3001/accounts';
  if (roles.includes('MANAGER')) return 'http://localhost:3001/inventory';
  if (roles.includes('DESK STAFF')) return 'http://localhost:3001/staff/appointments';
  if (roles.includes('SA')) return 'http://localhost:3001/advisor';

  return '/customer/profile';
};
