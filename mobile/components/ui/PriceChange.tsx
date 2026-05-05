import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface PriceChangeProps {
  changePercent: number | string | null | undefined;
}

export function PriceChange({ changePercent }: PriceChangeProps) {
  if (changePercent == null || changePercent === '') {
    return <Text style={styles.neutral}>—</Text>;
  }

  const value = typeof changePercent === 'string' ? parseFloat(changePercent) : changePercent;

  if (isNaN(value)) return <Text style={styles.neutral}>—</Text>;

  const isPositive = value >= 0;
  const arrow = isPositive ? '▲' : '▼';
  const formatted = `${arrow} ${Math.abs(value).toFixed(2)}%`;

  return (
    <Text style={isPositive ? styles.positive : styles.negative}>{formatted}</Text>
  );
}

const styles = StyleSheet.create({
  positive: { color: Colors.success, fontWeight: '600', fontSize: 13 },
  negative: { color: Colors.danger, fontWeight: '600', fontSize: 13 },
  neutral: { color: Colors.textMuted, fontWeight: '600', fontSize: 13 },
});
