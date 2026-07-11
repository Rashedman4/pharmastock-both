import { Tabs, Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth.store';
import { Colors } from '@/constants/colors';
import { useUnreadCount } from '@/hooks/useNotifications';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  name,
  focused,
}: {
  name: IoniconsName;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
      <Ionicons
        name={name}
        size={22}
        color={focused ? Colors.white : Colors.textMuted}
      />
    </View>
  );
}

function BellIcon({ focused }: { focused: boolean }) {
  const { data: count = 0 } = useUnreadCount();
  return (
    <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
      <Ionicons
        name={focused ? 'notifications' : 'notifications-outline'}
        size={22}
        color={focused ? Colors.white : Colors.textMuted}
      />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { isAuthenticated } = useAuthStore();
  const { t } = useTranslation();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="signals"
        options={{
          title: t('tabs.signals'),
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'trending-up' : 'trending-up-outline'}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: t('tabs.news'),
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'newspaper' : 'newspaper-outline'}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'person-circle' : 'person-circle-outline'}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('tabs.notifications'),
          tabBarIcon: ({ focused }) => <BellIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t('tabs.chat'),
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'chatbubble' : 'chatbubble-outline'}
              focused={focused}
            />
          ),
        }}
      />
      {/* Elite section — inside tabs so the tab bar stays visible, hidden from the tab bar itself */}
      <Tabs.Screen name="elite" options={{ href: null }} />
      {/* Daily update details — reachable from the News tab's nested switcher, hidden from the tab bar */}
      <Tabs.Screen name="daily-updates" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    height: 64,
    paddingBottom: 8,
    paddingTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  iconWrapper: {
    width: 38,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapperActive: {
    backgroundColor: Colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: Colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
});
