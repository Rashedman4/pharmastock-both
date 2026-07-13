import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Colors } from '@/constants/colors';
import { useLocalizedField } from '@/lib/i18n-content';
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
  const { t } = useTranslation();
  const getField = useLocalizedField();

  const date = new Date(item.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.company} numberOfLines={1}>
          {item.company}
        </Text>
        <View style={styles.symbolPill}>
          <Text style={styles.symbolText}>{item.symbol}</Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {getField(item, 'title')}
      </Text>

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

const styles = StyleSheet.create({
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
    color: Colors.textSecondary,
    marginRight: 8,
  },
  symbolPill: {
    backgroundColor: Colors.backgroundTertiary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  symbolText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 10,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spacer: { flex: 1 },
  date: { fontSize: 11, color: Colors.textMuted },
});
