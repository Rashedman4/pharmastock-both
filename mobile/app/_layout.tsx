import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { AppState, AppStateStatus } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import * as Notifications from 'expo-notifications';
import i18n, { initI18n } from '@/i18n';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { registerForPushNotifications, handleNotificationTap } from '@/lib/notifications';
import { disconnectSocket } from '@/lib/socket';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30_000 },
  },
});

export default function RootLayout() {
  const { hydrate, isLoading, isAuthenticated } = useAuthStore();
  const hydrateTheme = useThemeStore((state) => state.hydrate);
  const [i18nReady, setI18nReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // The theme is hydrated alongside i18n and auth so the first frame is
    // already in the chosen scheme — no flash of light before it loads.
    Promise.all([initI18n(), hydrate(), hydrateTheme()]).then(() =>
      setI18nReady(true)
    );
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      return;
    }

    // Register immediately on auth
    registerForPushNotifications().catch((err) => {
      console.warn('[Push] Registration failed:', err);
    });

    // Re-register whenever app comes back to foreground (handles first-run token issues)
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        registerForPushNotifications().catch(() => {});
      }
    });
    return () => sub.remove();
  }, [isAuthenticated]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationTap(response.notification, router);
    });
    return () => subscription.remove();
  }, [router]);

  // Cold start: a tap that launched the app from a killed state is already
  // consumed by the time the listener above mounts, so it has to be read back
  // explicitly. Deliberately deferred until auth has hydrated — routing into a
  // gated screen before that just bounces the user to the login screen — and
  // guarded so it fires only once per launch.
  const coldStartHandled = useRef(false);
  useEffect(() => {
    if (!i18nReady || !isAuthenticated || coldStartHandled.current) return;
    coldStartHandled.current = true;

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) handleNotificationTap(response.notification, router);
      })
      .catch(() => {});
  }, [i18nReady, isAuthenticated, router]);

  if (!i18nReady || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            <ThemedNavigator />
          </I18nextProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

/**
 * The navigator, wrapped in React Navigation's own theme.
 *
 * Without this, the navigator keeps its default light background and every
 * screen transition flashes white in dark mode. The light values below are the
 * same colours the default theme already used (`background` is #FFFFFF in the
 * light palette), so light mode is unchanged.
 */
function ThemedNavigator() {
  const { colors, scheme } = useTheme();

  const navigationTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: scheme === 'dark',
      colors: {
        ...base.colors,
        primary: colors.primaryText,
        background: colors.background,
        card: colors.surface,
        text: colors.textPrimary,
        border: colors.borderLight,
        notification: colors.danger,
      },
    };
  }, [colors, scheme]);

  return (
    <NavigationThemeProvider value={navigationTheme}>
      {/* Follows the resolved scheme, not the device's, so a manually chosen
          Light/Dark still gets the right status-bar contrast. */}
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        {/* Stock search and stock pages live outside the tabs: the tab bar
            already carries six items. */}
        <Stack.Screen name="stocks/search" />
        <Stack.Screen name="stock/[symbol]" />
      </Stack>
    </NavigationThemeProvider>
  );
}
