import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import type { AuthUser } from '@/types/user';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setTokens: (access: string, refresh: string) => Promise<void>;
  setUser: (user: AuthUser) => Promise<void>;
  hydrate: () => Promise<void>;
  clear: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,

  setTokens: async (access, refresh) => {
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, access);
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refresh);
    set({ accessToken: access, refreshToken: refresh, isAuthenticated: true });
  },

  setUser: async (user) => {
    await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));
    set({ user });
  },

  hydrate: async () => {
    try {
      const [access, refresh, userJson] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.USER),
      ]);
      const user = userJson ? (JSON.parse(userJson) as AuthUser) : null;
      set({
        accessToken: access,
        refreshToken: refresh,
        user,
        isAuthenticated: !!access,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  clear: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.USER),
    ]);
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },
}));
