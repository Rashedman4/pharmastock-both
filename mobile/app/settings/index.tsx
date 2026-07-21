import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { directionArrow, rowDirection } from '@/lib/rtl';
import Constants from 'expo-constants';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';

const PRIVACY_POLICY_URL: Record<string, string> = {
  en: 'https://biopharmastock.com/en/privacy-policy',
  ar: 'https://biopharmastock.com/ar/privacy-policy',
};

interface SettingsRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
}

function SettingsRow({ icon, label, value, onPress, danger }: SettingsRowProps) {
  const tint = danger ? Colors.danger : Colors.primary;
  return (
    <TouchableOpacity
      style={[styles.row, { flexDirection: rowDirection }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.rowLeft, { flexDirection: rowDirection }]}>
        <View style={[styles.iconBox, danger && { backgroundColor: Colors.danger + '15' }]}>
          <Ionicons name={icon} size={20} color={tint} />
        </View>
        <Text style={[styles.rowLabel, danger && { color: Colors.danger }]}>{label}</Text>
      </View>
      <View style={[styles.rowRight, { flexDirection: rowDirection }]}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        <Text style={styles.arrow}>{directionArrow}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { clear } = useAuthStore();
  const currentLang = i18n.language === 'ar' ? t('settings.arabic') : t('settings.english');
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const deleteMutation = useMutation({
    mutationFn: () => authService.deleteAccount(),
    onSuccess: async () => {
      await clear();
      router.replace('/(auth)/login');
    },
    onError: () => {
      Alert.alert(t('common.error_title'), t('settings.delete_account_error'));
    },
  });

  const confirmDeleteAccount = () =>
    Alert.alert(
      t('settings.delete_account_confirm_title'),
      t('settings.delete_account_confirm_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.delete_account_button'),
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ]
    );

  const openPrivacyPolicy = () => {
    const url = PRIVACY_POLICY_URL[i18n.language] ?? PRIVACY_POLICY_URL.en;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.app_preferences')}</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="language-outline"
            label={t('settings.language')}
            value={currentLang}
            onPress={() => router.push('/settings/language')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.about_section')}</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="information-circle-outline"
            label={t('settings.about_us')}
            onPress={() => router.push('/settings/about')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="document-text-outline"
            label={t('settings.privacy_policy')}
            onPress={openPrivacyPolicy}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.account_danger_section')}</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="trash-outline"
            label={t('settings.delete_account')}
            onPress={confirmDeleteAccount}
            danger
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.version')}</Text>
        <View style={[styles.versionCard, { flexDirection: rowDirection }]}>
          <Text style={styles.versionLabel}>{t('settings.version')}</Text>
          <Text style={styles.versionValue}>{appVersion}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 48 },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  card: {
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: { alignItems: 'center', gap: 12 },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: { fontSize: 15, fontWeight: '500', color: Colors.text },
  rowRight: { alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 14, color: Colors.textSecondary },
  arrow: { fontSize: 20, color: Colors.textMuted },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: 16 },
  versionCard: {
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  versionLabel: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  versionValue: { fontSize: 14, color: Colors.textSecondary },
});
