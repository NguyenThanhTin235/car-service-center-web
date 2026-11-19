import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { store } from '../store';
import { logout, setCredentials } from '../store/slices/authSlice';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
    'x-portal': 'internal',
  },
});

const AUTH_NO_REFRESH_PATHS = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/forgot-password',
  '/api/auth/verify-otp-reset',
  '/api/auth/reset-password',
];

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  for (const prom of failedQueue) {
    if (error) prom.reject(error);
    else prom.resolve(token);
  }
  failedQueue = [];
}

function forceClientLogout() {
  store.dispatch(logout());
  if (typeof window !== 'undefined') {
    if ('BroadcastChannel' in window) {
      try {
        const ch = new BroadcastChannel('csc_session_channel');
        ch.postMessage({ type: 'USER_LOGGED_OUT' });
        ch.close();
      } catch {}
    }
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }
}

// Attach Bearer token from localStorage if present (for complete origin isolation)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor to auto-refresh Access Token on 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const reqUrl = originalRequest.url || '';
    if (AUTH_NO_REFRESH_PATHS.some((p) => reqUrl.includes(p)) || originalRequest._retry) {
      if (reqUrl.includes('/api/auth/refresh')) {
        forceClientLogout();
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (newToken) => {
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const storedRefreshToken =
        typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

      const refreshRes = await axios.post(
        `${BASE_URL}/api/auth/refresh`,
        storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'x-portal': 'internal',
          },
        }
      );

      const { token, refreshToken, user } = refreshRes.data?.data || {};
      if (!token || !user) {
        throw new Error('Invalid refresh response');
      }

      store.dispatch(setCredentials({ user, token, refreshToken }));
      processQueue(null, token);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
      }
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      forceClientLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
