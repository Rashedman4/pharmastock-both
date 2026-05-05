import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';

export default function EliteLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: '',
      }}
    >
      <Stack.Screen name="apply" options={{ title: 'Apply for Elite' }} />
      <Stack.Screen name="status" options={{ title: 'Application Status' }} />
      <Stack.Screen name="dashboard" options={{ title: 'Elite Dashboard' }} />
      <Stack.Screen name="trade-plans/index" options={{ title: 'Trade Plans' }} />
      <Stack.Screen name="trade-plans/[id]" options={{ title: 'Trade Plan' }} />
      <Stack.Screen name="trade-plans/[id]/messages" options={{ title: 'Messages' }} />
      <Stack.Screen name="portfolio" options={{ title: 'Portfolio' }} />
      <Stack.Screen name="executions" options={{ title: 'Executions' }} />
      <Stack.Screen name="close-requests" options={{ title: 'Close Requests' }} />
      <Stack.Screen name="firm-profit" options={{ title: 'Firm Profit Payments' }} />
      <Stack.Screen name="firm-profit-proof" options={{ title: 'Upload Proof' }} />
    </Stack>
  );
}
