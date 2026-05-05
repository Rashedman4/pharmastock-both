import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantStyles: Record<
  BadgeVariant,
  { background: string; text: string }
> = {
  success: { background: Colors.successLight, text: Colors.success },
  danger: { background: Colors.dangerLight, text: Colors.danger },
  warning: { background: Colors.warningLight, text: Colors.warning },
  info: { background: Colors.infoLight, text: Colors.info },
  neutral: { background: Colors.backgroundSecondary, text: Colors.textSecondary },
  primary: { background: Colors.backgroundTertiary, text: Colors.primary },
};

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const { background, text } = variantStyles[variant];
  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
