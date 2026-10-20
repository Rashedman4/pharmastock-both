import React, { createContext, useContext, useMemo } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import {
  darkColors,
  lightColors,
  type AppColors,
} from '@/constants/colors';
import { useThemeStore, type ThemeMode } from '@/stores/theme.store';

export type ColorScheme = 'light' | 'dark';

interface ThemeValue {
  /** The palette for the active scheme. Screens read only this. */
  colors: AppColors;
  /** What is actually on screen now. */
  scheme: ColorScheme;
  /** What the user picked; `system` means "follow the device". */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

/**
 * Resolves a mode plus the device scheme into a palette.
 *
 * Exported for the places that cannot use a hook — the class-based
 * ErrorBoundary reads the store directly through this.
 *
 * `useColorScheme()` returns `light` on a build whose native
 * `userInterfaceStyle` is still pinned to light, which is exactly what an older
 * binary receiving this code over OTA does. The explicit Light/Dark options
 * keep working there; only `system` is degraded, and it degrades to light.
 */
export function resolveScheme(
  mode: ThemeMode,
  systemScheme: ColorScheme | null | undefined
): ColorScheme {
  if (mode === 'system') return systemScheme === 'dark' ? 'dark' : 'light';
  return mode;
}

export function colorsForScheme(scheme: ColorScheme): AppColors {
  return scheme === 'dark' ? darkColors : lightColors;
}

const ThemeContext = createContext<ThemeValue>({
  colors: lightColors,
  scheme: 'light',
  mode: 'system',
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  const value = useMemo<ThemeValue>(() => {
    const scheme = resolveScheme(mode, systemScheme);
    return { colors: colorsForScheme(scheme), scheme, mode, setMode };
  }, [mode, systemScheme, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}

/** The palette outside React — for the ErrorBoundary's render path. */
export function currentColors(): AppColors {
  return colorsForScheme(
    resolveScheme(useThemeStore.getState().mode, Appearance.getColorScheme())
  );
}
