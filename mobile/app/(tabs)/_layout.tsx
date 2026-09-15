import { Tabs, Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // iOS-only tab bar corrections. On an iPhone with rounded display corners the
  // outermost of the six tabs is clipped by the corner radius, and its label
  // truncates. Android is unaffected and must stay byte-identical, so every
  // value below is null on Android and merges over nothing.
  const iosTabBar =
    Platform.OS === 'ios'
      ? {
          // Clear the corner radius. insets.left/right are non-zero on notched
          // devices in landscape; the floor covers portrait, where they are 0
          // but the corner still cuts in.
          paddingHorizontal: Math.max(insets.left, insets.right, 8) + 4,
          // Slightly more clearance than the raw inset so labels don't sit on
          // the home indicator; devices without one keep the original 8.
          paddingBottom: insets.bottom > 0 ? insets.bottom + 2 : 8,
          height: 56 + (insets.bottom > 0 ? insets.bottom + 2 : 0),
        }
      : null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 56 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 8),
          },
          iosTabBar,
        ],
        tabBarItemStyle: Platform.OS === 'ios' ? styles.tabItemIOS : undefined,
        tabBarLabelStyle: [styles.tabLabel, Platform.OS === 'ios' ? styles.tabLabelIOS : null],
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
        name="breakthroughs"
        options={{
          title: t('tabs.breakthroughs'),
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'flask' : 'flask-outline'} focused={focused} />
          ),
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
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('tabs.notifications'),
          tabBarIcon: ({ focused }) => <BellIcon focused={focused} />,
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
  // Six labels on a 320pt iPhone SE leave ~53pt per tab; trimming the label a
  // point and reclaiming the item's default horizontal padding buys the room.
  tabLabelIOS: {
    fontSize: 10,
  },
  tabItemIOS: {
    paddingHorizontal: 2,
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
