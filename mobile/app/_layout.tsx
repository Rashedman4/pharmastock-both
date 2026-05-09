import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { AppState, AppStateStatus } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import * as Notifications from 'expo-notifications';
import i18n, { initI18n } from '@/i18n';
import { useAuthStore } from '@/stores/auth.store';
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
  const [i18nReady, setI18nReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    Promise.all([initI18n(), hydrate()]).then(() => setI18nReady(true));
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

  if (!i18nReady || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
          </Stack>
        </I18nextProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
