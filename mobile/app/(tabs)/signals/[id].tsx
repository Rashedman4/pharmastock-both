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
import { useSignal } from '@/hooks/useSignals';
import { Badge } from '@/components/ui/Badge';
import { Colors } from '@/constants/colors';
import { useLocalizedField } from '@/lib/i18n-content';
import { isRTL, rowDirection } from '@/lib/rtl';

function formatPrice(val: string | null | undefined): string {
  if (!val) return '—';
  const n = parseFloat(val);
  return isNaN(n) ? '—' : `$${n.toFixed(2)}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function SignalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const getField = useLocalizedField();
  const { data: signal, isLoading, isError } = useSignal(Number(id));

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isError || !signal) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t('common.error')}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isBuy = signal.type?.toUpperCase() === 'BUY';
  const reason = getField(signal, 'reason');

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { flexDirection: rowDirection }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>{isRTL ? '›' : '‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{signal.symbol}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.symbol}>{signal.symbol}</Text>
          <Badge
            label={isBuy ? t('signals.buy') : t('signals.sell')}
            variant={isBuy ? 'success' : 'danger'}
          />
        </View>

        <View style={styles.priceGrid}>
          <PriceCell label={t('signals.entry')} value={formatPrice(signal.enter_price)} />
          <PriceCell label={t('signals.target_1')} value={formatPrice(signal.first_target)} />
          <PriceCell label={t('signals.target_2')} value={formatPrice(signal.second_target)} />
          <PriceCell label={t('signals.price_now')} value={formatPrice(signal.price_now)} accent />
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('signals.opened')}</Text>
          <Text style={styles.infoValue}>{formatDate(signal.date_opened)}</Text>
        </View>

        {reason ? (
          <View style={styles.reasonSection}>
            <Text style={styles.sectionTitle}>{t('signals.reason')}</Text>
            <Text style={styles.reasonText}>{reason}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function PriceCell({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={cellStyles.cell}>
      <Text style={cellStyles.label}>{label}</Text>
      <Text style={[cellStyles.value, accent && { color: Colors.accent }]}>{value}</Text>
    </View>
  );
}

const cellStyles = StyleSheet.create({
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: { fontSize: 11, color: Colors.textMuted, marginBottom: 4, fontWeight: '500' },
  value: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
});

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
  backArrow: { fontSize: 28, color: Colors.primary, fontWeight: '400' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  content: { padding: 16 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  symbol: { fontSize: 28, fontWeight: '900', color: Colors.primary },
  priceGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  infoLabel: { fontSize: 14, color: Colors.textMuted },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  reasonSection: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary, marginBottom: 8 },
  reasonText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  errorText: { fontSize: 16, color: Colors.danger, marginBottom: 12 },
  backLink: { color: Colors.accent, fontWeight: '600' },
});
