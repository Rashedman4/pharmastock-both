import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { AutoText } from '@/components/ui/AutoText';
import { Badge } from '@/components/ui/Badge';
import type { AppColors } from '@/constants/colors';
import { useTheme } from '@/lib/theme';
import { useLocalizedField } from '@/lib/i18n-content';
import { stockHref } from '@/lib/stockLink';
import { formatDate } from '@/lib/format';
import type { Breakthrough } from '@/types/content';

interface BreakthroughCardProps {
  item: Breakthrough;
  onPress?: () => void;
}

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

export const BreakthroughCard = React.memo(function BreakthroughCard({ item, onPress }: BreakthroughCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  const router = useRouter();
  const getField = useLocalizedField();

  const date = formatDate(item.created_at, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <AutoText style={styles.company} numberOfLines={1}>
          {item.company}
        </AutoText>
        <TouchableOpacity
          style={styles.symbolPill}
          onPress={() => router.push(stockHref(item.symbol) as never)}
          activeOpacity={0.7}
        >
          <Text style={styles.symbolText}>{item.symbol}</Text>
        </TouchableOpacity>
      </View>

      <AutoText style={styles.title} numberOfLines={2}>
        {getField(item, 'title')}
      </AutoText>

      <View style={styles.badges}>
        <Badge
          label={t(`breakthroughs.${item.category}`)}
          variant={categoryVariant[item.category]}
        />
        <View style={{ width: 6 }} />
        <Badge
          label={t(`breakthroughs.${item.stage}`)}
          variant={stageVariant[item.stage]}
        />
        <View style={styles.spacer} />
        <Text style={styles.date}>{date}</Text>
      </View>
    </Card>
  );
});

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  company: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: c.textSecondary,
    marginEnd: 8,
  },
  symbolPill: {
    backgroundColor: c.backgroundTertiary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: c.primary + '30',
  },
  symbolText: {
    fontSize: 11,
    fontWeight: '700',
    color: c.primaryText,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: c.textPrimary,
    lineHeight: 22,
    marginBottom: 10,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spacer: { flex: 1 },
  date: { fontSize: 11, color: c.textMuted },
});
