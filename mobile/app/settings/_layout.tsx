import { Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useRTL } from '@/lib/rtl';
import { goBackOr } from '@/lib/navigation';

export default function SettingsLayout() {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.primary,
        headerTitleStyle: { fontWeight: '700', color: Colors.primaryDark },
        headerBackTitle: '',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t('settings.title'),
          // "index" is the root of this nested stack, so expo-router has no
          // in-stack history to auto-generate a back button from — without
          // this, a user pushed here from the Profile tab has no way back
          // except the OS swipe gesture, which is easy to miss.
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => goBackOr('/(tabs)/profile')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons
                name={isRTL ? 'chevron-forward' : 'chevron-back'}
                size={26}
                color={Colors.primary}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="language" options={{ title: t('settings.language_title') }} />
      <Stack.Screen name="about" options={{ title: t('about.title') }} />
    </Stack>
  );
}
