import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/colors';

export default function SettingsLayout() {
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.primary,
        headerTitleStyle: { fontWeight: '700', color: Colors.primaryDark },
        headerBackTitle: '',
      }}
    >
      <Stack.Screen name="index" options={{ title: t('settings.title') }} />
      <Stack.Screen name="language" options={{ title: t('settings.language_title') }} />
      <Stack.Screen name="about" options={{ title: t('about.title') }} />
    </Stack>
  );
}
