import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_ROUTES } from '@/constants/api';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import type { RefreshResponse } from '@/types/api';

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          original._retry = true;
          resolve(apiClient(original));
        });
      });
    }

    isRefreshing = true;
    original._retry = true;

    try {
      const storedRefresh = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      if (!storedRefresh) throw new Error('No refresh token');

      const { data } = await axios.post<RefreshResponse>(
        `${API_BASE_URL}${API_ROUTES.auth.refresh}`,
        { refresh_token: storedRefresh }
      );

      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
      onRefreshed(data.access_token);
      original.headers.Authorization = `Bearer ${data.access_token}`;
      return apiClient(original);
    } catch {
      refreshQueue = [];
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);
