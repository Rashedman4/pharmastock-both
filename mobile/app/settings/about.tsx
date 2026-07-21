import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/colors';

export default function AboutScreen() {
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 48, alignItems: 'center' },
  logoWrap: { marginTop: 12, marginBottom: 16 },
  logo: { width: 88, height: 88 },
  tagline: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 16,
  },
  pitch: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.text,
    textAlign: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 24,
  },
  companyLine: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  contactEmail: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
