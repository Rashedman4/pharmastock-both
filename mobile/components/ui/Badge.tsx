import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { AppColors } from '@/constants/colors';
import { useTheme } from '@/lib/theme';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

/** Variant colours have to be built per theme, so this takes the palette. */
const variantColors = (
  c: AppColors
): Record<BadgeVariant, { background: string; text: string }> => ({
  success: { background: c.successLight, text: c.success },
  danger: { background: c.dangerLight, text: c.danger },
  warning: { background: c.warningLight, text: c.warning },
  info: { background: c.infoLight, text: c.info },
  neutral: { background: c.backgroundSecondary, text: c.textSecondary },
  primary: { background: c.backgroundTertiary, text: c.primaryText },
});

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const { colors } = useTheme();
  const { background, text } = useMemo(
    () => variantColors(colors)[variant],
    [colors, variant]
  );

  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

// No colours here, so these stay a plain module-level stylesheet.
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
