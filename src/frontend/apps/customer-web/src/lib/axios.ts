import { createApiClient } from '@car-service-center/lib';

const AUTH_NO_REFRESH_PATHS = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/send-otp-register',
  '/api/auth/verify-otp-register',
  '/api/auth/forgot-password',
  '/api/auth/verify-otp-reset',
  '/api/auth/reset-password',
];

const { api, registerAuthHandlers } = createApiClient({
  portal: 'customer',
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  noRefreshPaths: AUTH_NO_REFRESH_PATHS,
});

export { registerAuthHandlers };
export default api;
