import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/colors';

export default function EliteLayout() {
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: '',
      }}
    >
      <Stack.Screen name="apply"               options={{ title: t('elite.apply') }} />
      <Stack.Screen name="status"              options={{ title: t('elite.status') }} />
      <Stack.Screen name="dashboard"           options={{ title: t('elite.dashboard') }} />
      <Stack.Screen name="portfolio"           options={{ title: t('elite.portfolio') }} />
      <Stack.Screen name="executions"          options={{ title: t('elite.executions') }} />
      <Stack.Screen name="close-requests"      options={{ title: t('elite.close_requests') }} />
      <Stack.Screen name="trade-plans/index"        options={{ title: t('elite.trade_plans') }} />
      <Stack.Screen name="trade-plans/[id]"         options={{ title: t('elite.plan_detail') }} />
      <Stack.Screen name="trade-plans/[id]/messages" options={{ title: t('elite.messages') }} />
    </Stack>
  );
}
