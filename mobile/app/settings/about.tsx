import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AppColors } from '@/constants/colors';
import { useTheme } from '@/lib/theme';

export default function AboutScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.logoWrap}>
        <Image
          source={require('@/assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.tagline}>{t('about.tagline')}</Text>

      <View style={styles.card}>
        <Text style={styles.pitch}>{t('about.pitch')}</Text>
      </View>

      <View style={styles.divider} />

      <Text style={styles.companyLine}>{t('about.company_line')}</Text>
      <Text style={styles.contactEmail}>{t('about.contact_email')}</Text>
    </ScrollView>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  content: { padding: 20, paddingBottom: 48, alignItems: 'center' },
  logoWrap: { marginTop: 12, marginBottom: 16 },
  logo: { width: 88, height: 88 },
  tagline: {
    fontSize: 16,
    fontWeight: '700',
    color: c.primaryText,
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    width: '100%',
    backgroundColor: c.backgroundTertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.borderLight,
    padding: 16,
  },
  pitch: {
    fontSize: 14,
    lineHeight: 22,
    color: c.text,
    textAlign: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: c.borderLight,
    marginVertical: 24,
  },
  companyLine: {
    fontSize: 12,
    color: c.textSecondary,
    textAlign: 'center',
  },
  contactEmail: {
    fontSize: 12,
    color: c.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
