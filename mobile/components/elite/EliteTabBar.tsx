import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { usePathname, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

type Tab = {
  labelKey: string;
  path: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconActive: React.ComponentProps<typeof Ionicons>['name'];
};

const TABS: Tab[] = [
  {
    labelKey: 'elite.tab_dashboard',
    path: '/elite/dashboard',
    icon: 'grid-outline',
    iconActive: 'grid',
  },
  {
    labelKey: 'elite.tab_plans',
    path: '/elite/trade-plans',
    icon: 'trending-up-outline',
    iconActive: 'trending-up',
  },
  {
    labelKey: 'elite.tab_portfolio',
    path: '/elite/portfolio',
    icon: 'briefcase-outline',
    iconActive: 'briefcase',
  },
  {
    labelKey: 'elite.tab_payments',
    path: '/elite/payments',
    icon: 'cash-outline',
    iconActive: 'cash',
  },
];

export function EliteTabBar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const isActive = (path: string) => {
    if (path === '/elite/trade-plans') {
      return pathname.startsWith('/elite/trade-plans');
    }
    return pathname === path || pathname.startsWith(path + '/');
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab) => {
        const active = isActive(tab.path);
        return (
          <TouchableOpacity
            key={tab.path}
            style={styles.tab}
            onPress={() => router.replace(tab.path as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <Ionicons
                name={active ? tab.iconActive : tab.icon}
                size={20}
                color={active ? '#fff' : Colors.textMuted}
              />
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{t(tab.labelKey)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  iconWrap: {
    width: 36,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: Colors.primary,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 2,
  },
  labelActive: {
    color: Colors.primary,
  },
});
