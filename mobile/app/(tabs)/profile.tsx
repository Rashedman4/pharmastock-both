import React from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { fetchEliteStatus } from '@/services/elite.service';
import { useRTL } from '@/lib/rtl';

function EliteSection() {
  const { t } = useTranslation();
  const { isRTL } = useRTL();

  // Source of truth is always the fresh elite-status query — never the auth
  // store's cached user.is_elite, which can be stale right after an approval
  // and would otherwise flash "Apply for Elite" for an already-enrolled user.
  const { data: eliteStatus, isLoading } = useQuery({
    queryKey: ['elite-status'],
    queryFn: fetchEliteStatus,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('profile.elite_section')}</Text>
        <View style={[styles.eliteRow, { opacity: 0.6 }]}>
          <View style={styles.eliteRowLeft}>
            <Ionicons name="star" size={22} color={Colors.primary} />
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        </View>
      </View>
    );
  }

  const isElite = !!eliteStatus?.is_elite_member;

  const navigateElite = () => {
    if (isElite) {
      router.push('/elite/dashboard');
    } else if (eliteStatus?.has_application) {
      router.push('/elite/status');
    } else {
      router.push('/elite/apply');
    }
  };

  const label = isElite
    ? t('profile.open_elite')
    : eliteStatus?.has_application
    ? t('profile.view_application')
    : t('profile.apply_elite');

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{t('profile.elite_section')}</Text>
      <TouchableOpacity style={styles.eliteRow} onPress={navigateElite} activeOpacity={0.7}>
        <View style={styles.eliteRowLeft}>
          <Ionicons name="star" size={22} color={Colors.primary} />
          <View>
            <Text style={styles.eliteRowTitle}>{label}</Text>
            {isElite && (
              <Text style={styles.eliteRowSub}>{t('profile.elite_member')}</Text>
            )}
          </View>
        </View>
        <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, refreshToken, clear } = useAuthStore();
  const { isRTL } = useRTL();

  const logoutMutation = useMutation({
    mutationFn: () =>
      authService.logout({ refresh_token: refreshToken ?? undefined }),
    onSettled: async () => {
      await clear();
      router.replace('/(auth)/login');
    },
  });

  const confirmLogout = () =>
    Alert.alert(t('common.sign_out'), t('common.sign_out_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.sign_out'), style: 'destructive', onPress: () => logoutMutation.mutate() },
    ]);

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')}
          </Text>
        </View>

        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.role && (
          <Text style={styles.role}>{user.role.toUpperCase()}</Text>
        )}

        <View style={styles.badges}>
          {user?.is_elite && (
            <View style={[styles.badge, styles.eliteBadge]}>
              <Text style={styles.badgeText}>{t('profile.elite_member')}</Text>
            </View>
          )}
          {user?.is_partner && (
            <View style={[styles.badge, styles.partnerBadge]}>
              <Text style={styles.badgeText}>{t('common.partner')}</Text>
            </View>
          )}
        </View>
      </View>

      <EliteSection />

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('profile.account_section')}</Text>
        <TouchableOpacity
          style={styles.eliteRow}
          onPress={() => router.push('/edit-profile')}
          activeOpacity={0.7}
        >
          <View style={styles.eliteRowLeft}>
            <Ionicons name="person-outline" size={22} color={Colors.primary} />
            <View>
              <Text style={styles.eliteRowTitle}>{t('profile.edit_profile')}</Text>
              <Text style={styles.eliteRowSub}>{t('profile.edit_profile_subtitle')}</Text>
            </View>
          </View>
          <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('settings.app_preferences')}</Text>
        <TouchableOpacity
          style={styles.eliteRow}
          onPress={() => router.push('/settings')}
          activeOpacity={0.7}
        >
          <View style={styles.eliteRowLeft}>
            <Ionicons name="settings-outline" size={22} color={Colors.primary} />
            <View>
              <Text style={styles.eliteRowTitle}>{t('profile.settings')}</Text>
              <Text style={styles.eliteRowSub}>{t('profile.settings_subtitle')}</Text>
            </View>
          </View>
          <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Button
        title={t('common.sign_out')}
        variant="outline"
        onPress={confirmLogout}
        isLoading={logoutMutation.isPending}
        containerStyle={styles.logoutBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1, backgroundColor: Colors.background },
  container: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 48,
    minHeight: '100%',
  },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  name: { fontSize: 22, fontWeight: '700', color: Colors.primaryDark, marginBottom: 4 },
  email: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  role: { fontSize: 12, color: Colors.primary, fontWeight: '600', letterSpacing: 1 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 12 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  eliteBadge: { backgroundColor: '#fef3c7' },
  partnerBadge: { backgroundColor: '#d1fae5' },
  badgeText: { fontSize: 12, fontWeight: '600', color: Colors.text },
  section: {
    width: '100%',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  eliteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  eliteRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eliteRowTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  eliteRowSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  logoutBtn: { width: '100%', marginTop: 'auto' },
});
