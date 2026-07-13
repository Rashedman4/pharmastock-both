import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { useLocalizedField } from '@/lib/i18n-content';
import type { DailyUpdateItem } from '@/types/content';

interface DailyUpdateCardProps {
  item: DailyUpdateItem;
  onPress?: () => void;
}

export const DailyUpdateCard = React.memo(function DailyUpdateCard({ item, onPress }: DailyUpdateCardProps) {
  const { t } = useTranslation();
  const getField = useLocalizedField();

  function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const days = Math.floor((now - then) / (1000 * 60 * 60 * 24));
    if (days === 0) return t('dailyUpdates.today');
    if (days === 1) return t('dailyUpdates.one_day_ago');
    if (days < 30) return t('dailyUpdates.days_ago', { count: days });
    const months = Math.floor(days / 30);
    return months === 1
      ? t('dailyUpdates.one_month_ago')
      : t('dailyUpdates.months_ago', { count: months });
  }

  const subtitle = getField(item, 'subtitle');

  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.symbolPill}>
          <Text style={styles.symbolText}>{item.symbol}</Text>
        </View>
      </View>

      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}

      <Text style={styles.description} numberOfLines={3}>
        {getField(item, 'description')}
      </Text>

      <Text style={styles.date}>{timeAgo(item.published_date)}</Text>
    </Card>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  symbolPill: {
    backgroundColor: Colors.backgroundTertiary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  symbolText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  date: { fontSize: 12, color: Colors.textMuted },
});
