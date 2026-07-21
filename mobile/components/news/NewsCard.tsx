import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { useLocalizedField } from '@/lib/i18n-content';
import { rowDirection } from '@/lib/rtl';
import type { NewsItem } from '@/types/content';

interface NewsCardProps {
  item: NewsItem;
  onPress?: () => void;
}

export const NewsCard = React.memo(function NewsCard({ item, onPress }: NewsCardProps) {
  const { t } = useTranslation();
  const getField = useLocalizedField();

  function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const days = Math.floor((now - then) / (1000 * 60 * 60 * 24));
    if (days === 0) return t('news.today');
    if (days === 1) return t('news.one_day_ago');
    if (days < 30) return t('news.days_ago', { count: days });
    const months = Math.floor(days / 30);
    return months === 1 ? t('news.one_month_ago') : t('news.months_ago', { count: months });
  }

  return (
    <Card onPress={onPress}>
      <View style={[styles.header, { flexDirection: rowDirection }]}>
        <View style={styles.symbolPill}>
          <Text style={styles.symbolText}>{item.symbol}</Text>
        </View>
        {item.price != null && (
          <Text style={styles.price}>${parseFloat(item.price).toFixed(2)}</Text>
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {getField(item, 'title')}
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
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accent,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 8,
  },
  date: { fontSize: 12, color: Colors.textMuted },
});
