import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Colors } from '@/constants/colors';
import { useLocalizedField } from '@/lib/i18n-content';
import type { Signal } from '@/types/content';

interface SignalCardProps {
  signal: Signal;
  onPress?: () => void;
  compact?: boolean;
}

function formatPrice(val: string | null | undefined): string {
  if (!val) return '—';
  const n = parseFloat(val);
  return isNaN(n) ? '—' : `$${n.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export const SignalCard = React.memo(function SignalCard({ signal, onPress, compact = false }: SignalCardProps) {
  const { t } = useTranslation();
  const getField = useLocalizedField();

  const isBuy = signal.type?.toUpperCase() === 'BUY';
  const badgeVariant = isBuy ? 'success' : 'danger';
  const badgeLabel = isBuy ? t('signals.buy') : t('signals.sell');

  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.symbol}>{signal.symbol}</Text>
        <Badge label={badgeLabel} variant={badgeVariant} />
      </View>

      <View style={styles.priceGrid}>
        <PriceColumn label={t('signals.entry')} value={formatPrice(signal.enter_price)} />
        <PriceDivider />
        <PriceColumn label={t('signals.target_1')} value={formatPrice(signal.first_target)} />
        <PriceDivider />
        <PriceColumn label={t('signals.target_2')} value={formatPrice(signal.second_target)} />
      </View>

      {!compact && (
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>{t('signals.price_now')}</Text>
            <Text style={styles.footerValue}>{formatPrice(signal.price_now)}</Text>
          </View>
          <Text style={styles.date}>
            {t('signals.opened')}: {signal.date_opened ? formatDate(signal.date_opened) : '—'}
          </Text>
        </View>
      )}
    </Card>
  );
});

function PriceColumn({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.priceCol}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={styles.priceValue}>{value}</Text>
    </View>
  );
}

function PriceDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  symbol: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  priceGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    paddingVertical: 10,
    marginBottom: 10,
  },
  priceCol: { flex: 1, alignItems: 'center' },
  priceLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 2, fontWeight: '500' },
  priceValue: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  divider: { width: 1, height: 32, backgroundColor: Colors.borderLight },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerLabel: { fontSize: 12, color: Colors.textMuted },
  footerValue: { fontSize: 13, fontWeight: '700', color: Colors.accent },
  date: { fontSize: 12, color: Colors.textMuted },
});
