import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/constants/storage-keys';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeState {
  /** What the user chose. `system` follows the device. */
  mode: ThemeMode;
  /** False until the stored choice has been read back. */
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setMode: (mode: ThemeMode) => void;
}

function isMode(value: string | null): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

/**
 * The theme preference, persisted with SecureStore — the same mechanism the
 * app already uses for the language (`i18n/index.ts`).
 *
 * Writes are fire-and-forget: a storage failure must not stop the user from
 * switching themes for this session.
 */
export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  hydrated: false,

  hydrate: async () => {
    const stored = await SecureStore.getItemAsync(STORAGE_KEYS.THEME).catch(
      () => null
    );
    set({ mode: isMode(stored) ? stored : 'system', hydrated: true });
  },

  setMode: (mode) => {
    set({ mode });
    SecureStore.setItemAsync(STORAGE_KEYS.THEME, mode).catch(() => {});
  },
}));
