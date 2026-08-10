import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_ROUTES } from '@/constants/api';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import type { RefreshResponse } from '@/types/api';
import i18n from '@/i18n';

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function onRefreshed(token: string) {
  refreshQueue.forEach(({ resolve }) => resolve(token));
  refreshQueue = [];
}

function onRefreshFailed(error: unknown) {
  refreshQueue.forEach(({ reject }) => reject(error));
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
  // Reflects the app's current in-memory language on every request, so
  // server-resolved bilingual content (e.g. notifications) never depends on
  // the DB's `preferred_language` column staying in sync with in-app toggles.
  config.headers['X-App-Language'] = i18n.language;
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
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (token: string) => {
            original.headers.Authorization = `Bearer ${token}`;
            original._retry = true;
            resolve(apiClient(original));
          },
          reject,
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

      // The server rotates the refresh token on every use (old one is
      // invalidated server-side), so the newly issued one must be persisted
      // here or the next refresh attempt will be rejected.
      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
      onRefreshed(data.access_token);
      original.headers.Authorization = `Bearer ${data.access_token}`;
      return apiClient(original);
    } catch (refreshError) {
      onRefreshFailed(refreshError);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);
