import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useRTL } from '@/lib/rtl';
import Constants from 'expo-constants';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { openWebApp } from '@/components/ui/WebAppLink';

const PRIVACY_POLICY_URL: Record<string, string> = {
  en: 'https://biopharmastock.com/en/privacy-policy',
  ar: 'https://biopharmastock.com/ar/privacy-policy',
};

const TERMS_OF_SERVICE_URL: Record<string, string> = {
  en: 'https://biopharmastock.com/en/terms-of-service',
  ar: 'https://biopharmastock.com/ar/terms-of-service',
};

interface SettingsRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  subtitle?: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
}

function SettingsRow({ icon, label, subtitle, value, onPress, danger }: SettingsRowProps) {
  const { isRTL } = useRTL();
  const tint = danger ? Colors.danger : Colors.primary;
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconBox, danger && { backgroundColor: Colors.danger + '15' }]}>
          <Ionicons name={icon} size={20} color={tint} />
        </View>
        <View>
          <Text style={[styles.rowLabel, danger && { color: Colors.danger }]}>{label}</Text>
          {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color={Colors.textMuted} />
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

  const openTermsOfService = () => {
    const url = TERMS_OF_SERVICE_URL[i18n.language] ?? TERMS_OF_SERVICE_URL.en;
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
          <View style={styles.divider} />
          <SettingsRow
            icon="globe-outline"
            label={t('common.visit_website')}
            onPress={openWebApp}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="document-outline"
            label={t('settings.terms_of_service')}
            onPress={openTermsOfService}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.account_danger_section')}</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="trash-outline"
            label={t('settings.delete_account')}
            subtitle={t('settings.delete_account_subtitle')}
            onPress={confirmDeleteAccount}
            danger
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.version')}</Text>
        <View style={styles.versionCard}>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: { fontSize: 15, fontWeight: '500', color: Colors.text },
  rowSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 14, color: Colors.textSecondary },
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
