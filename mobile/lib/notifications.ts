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

export function handleNotificationTap(
  notification: Notifications.Notification,
  router: { push: (path: string) => void }
): void {
  const data = notification.request.content.data as Record<string, unknown>;
  const screen = data?.screen as string | undefined;

  switch (screen) {
    case 'signals':
      if (data.signalId) router.push(`/signals/${data.signalId}`);
      else router.push('/(tabs)/signals');
      break;
    case 'chat':
      router.push('/chat');
      break;
    case 'elite':
      router.push('/elite/status');
      break;
    default:
      router.push('/notifications');
  }
}
