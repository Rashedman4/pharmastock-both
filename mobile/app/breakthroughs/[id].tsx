import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useBreakthrough } from '@/hooks/useContent';
import { Badge } from '@/components/ui/Badge';
import { Colors } from '@/constants/colors';
import { useLocalizedField } from '@/lib/i18n-content';

const categoryVariant = {
  drug: 'info' as const,
  therapy: 'success' as const,
  device: 'warning' as const,
};

const stageVariant = {
  research: 'neutral' as const,
  clinical: 'warning' as const,
  approved: 'success' as const,
};

export default function BreakthroughDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const getField = useLocalizedField();
  const { data: item, isLoading, isError } = useBreakthrough(Number(id));

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isError || !item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t('common.error')}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {item.symbol}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.companyRow}>
          <Text style={styles.company}>{item.company}</Text>
          <View style={styles.symbolPill}>
            <Text style={styles.symbolText}>{item.symbol}</Text>
          </View>
        </View>

        <Text style={styles.title}>{getField(item, 'title')}</Text>

        <View style={styles.badges}>
          <Badge
            label={t(`breakthroughs.${item.category}`)}
            variant={categoryVariant[item.category]}
          />
          <View style={{ width: 8 }} />
          <Badge
            label={t(`breakthroughs.${item.stage}`)}
            variant={stageVariant[item.stage]}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('breakthroughs.description')}</Text>
          <Text style={styles.sectionBody}>{getField(item, 'description')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('breakthroughs.potential_impact')}</Text>
          <Text style={styles.sectionBody}>{getField(item, 'potential_impact')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { width: 40, justifyContent: 'center' },
  backArrow: { fontSize: 28, color: Colors.primary },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.primary, flex: 1, textAlign: 'center' },
  content: { padding: 16 },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  company: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginRight: 8 },
  symbolPill: {
    backgroundColor: Colors.backgroundTertiary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  symbolText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 28,
    marginBottom: 12,
  },
  badges: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary, marginBottom: 8 },
  sectionBody: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  errorText: { fontSize: 16, color: Colors.danger, marginBottom: 12 },
  backLink: { color: Colors.accent, fontWeight: '600' },
});
