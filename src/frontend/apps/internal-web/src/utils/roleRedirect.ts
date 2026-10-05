export const getDashboardPathByRole = (roles: string[]): string => {
  if (!roles || roles.length === 0) return '/login';

  if (roles.includes('ADMIN')) return '/accounts';
  if (roles.includes('MANAGER')) return '/inventory';
  if (roles.includes('DESK STAFF')) return '/staff';
  if (roles.includes('SA')) return '/advisor';

  return '/home';
};
