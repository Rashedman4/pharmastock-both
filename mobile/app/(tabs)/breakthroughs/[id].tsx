import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { goBackOr } from '@/lib/navigation';
import { useTranslation } from 'react-i18next';
import { useBreakthrough } from '@/hooks/useContent';
import { Badge } from '@/components/ui/Badge';
import { AutoText } from '@/components/ui/AutoText';
import { Ionicons } from '@expo/vector-icons';
import type { AppColors } from '@/constants/colors';
import { useTheme } from '@/lib/theme';
import { useLocalizedField } from '@/lib/i18n-content';
import { useRTL } from '@/lib/rtl';
import { stockHref } from '@/lib/stockLink';

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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const getField = useLocalizedField();
  const { isRTL } = useRTL();
  const { data: item, isLoading, isError } = useBreakthrough(Number(id));

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primaryText} />
      </View>
    );
  }

  if (isError || !item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t('common.error')}</Text>
        <TouchableOpacity onPress={() => goBackOr('/(tabs)/breakthroughs')}>
          <Text style={styles.backLink}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBackOr('/(tabs)/breakthroughs')} style={styles.backBtn}>
          <Ionicons
            name={isRTL ? 'chevron-forward' : 'chevron-back'}
            size={26}
            color={colors.primaryText}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {item.symbol}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.companyRow}>
          <AutoText style={styles.company}>{item.company}</AutoText>
          <TouchableOpacity
            style={styles.symbolPill}
            onPress={() => router.push(stockHref(item.symbol) as never)}
            activeOpacity={0.7}
          >
            <Text style={styles.symbolText}>{item.symbol}</Text>
          </TouchableOpacity>
        </View>

        <AutoText style={styles.title}>{getField(item, 'title')}</AutoText>

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
          <AutoText style={styles.sectionBody}>{getField(item, 'description')}</AutoText>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('breakthroughs.potential_impact')}</Text>
          <AutoText style={styles.sectionBody}>{getField(item, 'potential_impact')}</AutoText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: c.backgroundSecondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.borderLight,
  },
  backBtn: { width: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: c.primaryText, flex: 1, textAlign: 'center' },
  content: { padding: 16 },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  company: { flex: 1, fontSize: 14, fontWeight: '600', color: c.textSecondary, marginEnd: 8 },
  symbolPill: {
    backgroundColor: c.backgroundTertiary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: c.primary + '30',
  },
  symbolText: { fontSize: 12, fontWeight: '700', color: c.primaryText },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: c.textPrimary,
    lineHeight: 28,
    marginBottom: 12,
  },
  badges: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  section: {
    backgroundColor: c.surface,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: c.borderLight,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: c.primaryText, marginBottom: 8 },
  sectionBody: { fontSize: 14, color: c.textSecondary, lineHeight: 22 },
  errorText: { fontSize: 16, color: c.danger, marginBottom: 12 },
  backLink: { color: c.accent, fontWeight: '600' },
});
