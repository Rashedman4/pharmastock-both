import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert, Platform } from 'react-native';
import { apiClient } from '@/services/api';
import i18n from '@/i18n';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  // iOS simulator cannot receive push notifications — Android emulators can
  if (Device.isDevice === false && Device.osName === 'iOS') {
    console.log('[Push] Push notifications not supported on iOS simulator');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus === 'undetermined') {
    // Show a one-time explainer before the native permission prompt, since
    // that prompt only ever appears once per install on both platforms.
    await new Promise<void>((resolve) => {
      Alert.alert(
        i18n.t('notifications.permission_title'),
        i18n.t('notifications.permission_body'),
        [{ text: i18n.t('common.ok'), onPress: () => resolve() }],
        { cancelable: false }
      );
    });
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  } else if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Permission not granted');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  let token: string;
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    token = tokenData.data;
    if (__DEV__) console.log('[Push] Got Expo push token:', token);
  } catch (err) {
    console.error('[Push] getExpoPushTokenAsync failed. Common causes:', err);
    console.error('[Push] - Android emulator needs "Google Play" system image (not just "Google APIs")');
    console.error('[Push] - Android emulator needs a Google account signed in (Settings > Accounts)');
    console.error('[Push] - EXPO_PUBLIC_PROJECT_ID must match your EAS project:', process.env.EXPO_PUBLIC_PROJECT_ID);
    return null;
  }

  try {
    await apiClient.post('/api/mobile/v1/push-token', {
      token,
      platform: Platform.OS,
      deviceId: Device.modelId ?? undefined,
    });
    console.log('[Push] Token registered with server successfully');
  } catch (err) {
    console.error('[Push] Failed to register token with server:', err);
  }

  return token;
}

/**
 * Where a notification should take the reader, from its `data` payload.
 *
 * Shared by push taps (foreground, background and cold start) and by taps on a
 * row in the Notifications tab, so the two can never disagree.
 *
 * The `default` branch is load-bearing: the backend still pushes
 * "New Idea" / "Idea Closed" notifications even though the app has no ideas
 * screen, and the Notifications tab is where they are readable (see
 * PROJECT_CONTEXT §6). Anything unrecognized goes there rather than
 * dead-ending on a route that does not exist.
 */
export function routeForNotification(data: Record<string, unknown> | undefined): string {
  const screen = data?.screen as string | undefined;
  const id = data?.id;
  const symbol = data?.symbol;

  switch (screen) {
    case 'chat':
      return '/chat';
    case 'daily-updates': {
      // Built by hand rather than with URLSearchParams: React Native's
      // polyfill for it is incomplete across platforms.
      const date = typeof data?.date === 'string' ? data.date : undefined;
      return date
        ? `/(tabs)/news?tab=daily-updates&date=${encodeURIComponent(date)}`
        : '/(tabs)/news?tab=daily-updates';
    }
    case 'announcement':
      return id ? `/(tabs)/announcements/${id}` : '/(tabs)/news?tab=announcements';
    case 'breakthrough':
      return id ? `/(tabs)/breakthroughs/${id}` : '/(tabs)/breakthroughs';
    case 'stock':
      return typeof symbol === 'string' && symbol
        ? `/stock/${encodeURIComponent(symbol.toUpperCase())}`
        : '/notifications';
    default:
      return '/notifications';
  }
}

export function handleNotificationTap(
  notification: Notifications.Notification,
  router: { push: (path: string) => void }
): void {
  const data = notification.request.content.data as Record<string, unknown>;
  router.push(routeForNotification(data));
}
