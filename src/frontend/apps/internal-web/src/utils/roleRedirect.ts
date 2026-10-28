export const getDashboardPathByRole = (roles: string[]): string => {
  if (!roles || !Array.isArray(roles) || roles.length === 0) return '/login';

  if (roles.includes('ADMIN')) return '/accounts';
  if (roles.includes('MANAGER')) return '/dashboard';
  if (roles.includes('DESK STAFF')) return '/staff';
  if (roles.includes('SA')) return '/advisor';

  // Fallback for internal portal: never return /home because internal-web has no /home
  return '/login';
};
