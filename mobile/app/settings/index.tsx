import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { directionArrow, rowDirection } from '@/lib/rtl';
import Constants from 'expo-constants';

interface SettingsRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress: () => void;
}

function SettingsRow({ icon, label, value, onPress }: SettingsRowProps) {
  return (
    <TouchableOpacity
      style={[styles.row, { flexDirection: rowDirection }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.rowLeft, { flexDirection: rowDirection }]}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={20} color={Colors.primary} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
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
  const currentLang = i18n.language === 'ar' ? t('settings.arabic') : t('settings.english');
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

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
