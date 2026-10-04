export const getDashboardPathByRole = (roles: string[]): string => {
  if (!roles || !Array.isArray(roles) || roles.length === 0) return '/login';

  if (roles.includes('ADMIN')) return '/admin';
  if (roles.includes('MANAGER')) return '/manager';
  if (roles.includes('DESK STAFF')) return '/staff';
  if (roles.includes('SA')) return '/advisor';
  if (roles.includes('CUSTOMER')) return '/customer';
  
  return '/';
};
