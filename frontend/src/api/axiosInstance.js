import axios from 'axios';
import { tokenStorage } from './tokenStorage';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const axiosInstance = axios.create({ baseURL: API_URL, timeout: 15000 });

// Add the JWT to every request that has one.
axiosInstance.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the server says "you are not signed in" on a protected call, sign the user out.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && tokenStorage.get() && !url.startsWith('/auth/login')) {
      onUnauthorized();
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
