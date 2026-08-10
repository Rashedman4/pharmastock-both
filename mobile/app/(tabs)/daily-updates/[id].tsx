import React from 'react';
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
import { useTranslation } from 'react-i18next';
import { useDailyUpdateItem } from '@/hooks/useContent';
import { Colors } from '@/constants/colors';
import { useLocalizedField } from '@/lib/i18n-content';
import { useRTL } from '@/lib/rtl';
import { formatDate } from '@/lib/format';

export default function DailyUpdateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const getField = useLocalizedField();
  const { isRTL } = useRTL();
  const { data: item, isLoading, isError } = useDailyUpdateItem(Number(id));

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

  const subtitle = getField(item, 'subtitle');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>{isRTL ? '›' : '‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {item.symbol}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.symbolRow}>
          <View style={styles.symbolPill}>
            <Text style={styles.symbolText}>{item.symbol}</Text>
          </View>
        </View>

        {subtitle ? <Text style={styles.title}>{subtitle}</Text> : null}

        <Text style={styles.description}>{getField(item, 'description')}</Text>

        <Text style={styles.date}>{formatDate(item.published_date, { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
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
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  symbolPill: {
    backgroundColor: Colors.backgroundTertiary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  symbolText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 28,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 16,
  },
  date: { fontSize: 13, color: Colors.textMuted },
  errorText: { fontSize: 16, color: Colors.danger, marginBottom: 12 },
  backLink: { color: Colors.accent, fontWeight: '600' },
});
