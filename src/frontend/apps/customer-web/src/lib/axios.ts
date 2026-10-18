import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
    'x-portal': 'customer',
  },
});

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

// Interceptor to handle global errors like 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized (e.g., redirect to login)
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
