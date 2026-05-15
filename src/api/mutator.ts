import axios, { type AxiosRequestConfig } from 'axios';
import { LOCALE_STORAGE_KEY, DEFAULT_LOCALE } from '../i18n';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
});

axiosInstance.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const locale = localStorage.getItem(LOCALE_STORAGE_KEY) ?? DEFAULT_LOCALE;
  config.headers['Accept-Language'] = locale;
  return config;
});

export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  return axiosInstance.request<T>(config).then((r) => r.data);
};
