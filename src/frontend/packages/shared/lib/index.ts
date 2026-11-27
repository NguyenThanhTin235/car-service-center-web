import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

export interface PortalAuthHandlers {
  onCredentialsRefreshed: (payload: {
    user: any;
    token: string;
    refreshToken?: string;
  }) => void;
  onForceLogout: () => void;
}

export interface CreateApiClientOptions {
  portal: 'customer' | 'internal';
  baseUrl?: string;
  noRefreshPaths: string[];
}

export function createApiClient(options: CreateApiClientOptions): {
  api: AxiosInstance;
  registerAuthHandlers: (handlers: PortalAuthHandlers) => void;
} {
  const baseUrl = options.baseUrl || 'http://localhost:5000';

  const api = axios.create({
    baseURL: baseUrl,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      'x-portal': options.portal,
    },
  });

  let authHandlers: PortalAuthHandlers | null = null;
  let isRefreshing = false;
  let failedQueue: Array<{
    resolve: (token: string | null) => void;
    reject: (err: unknown) => void;
  }> = [];

  const registerAuthHandlers = (handlers: PortalAuthHandlers) => {
    authHandlers = handlers;
  };

  function processQueue(error: unknown, token: string | null = null) {
    for (const prom of failedQueue) {
      if (error) prom.reject(error);
      else prom.resolve(token);
    }
    failedQueue = [];
  }

  function forceClientLogout() {
    if (authHandlers) {
      authHandlers.onForceLogout();
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
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

  api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

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
      if (options.noRefreshPaths.some((p) => reqUrl.includes(p)) || originalRequest._retry) {
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
          `${baseUrl}/api/auth/refresh`,
          storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              'x-portal': options.portal,
            },
          }
        );

        const { token, refreshToken, user } = refreshRes.data?.data || {};
        if (!token || !user) {
          throw new Error('Invalid refresh response');
        }

        authHandlers?.onCredentialsRefreshed({ user, token, refreshToken });
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

  return { api, registerAuthHandlers };
}
