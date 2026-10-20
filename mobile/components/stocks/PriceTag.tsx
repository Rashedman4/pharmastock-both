import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { AppColors } from '@/constants/colors';
import { useTheme } from '@/lib/theme';
import type { CachedPrice } from '@/types/content';

interface Props {
  price: CachedPrice | null;
  /** `lg` for the stock page header, `sm` for list rows. */
  size?: 'sm' | 'lg';
}

/**
 * Cached price plus its change.
 *
 * Prices come from the server's cache only, so a symbol nobody has priced yet
 * shows "—" rather than triggering a provider call.
 */
export function PriceTag({ price, size = 'sm' }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const current = price?.current_price != null ? Number(price.current_price) : null;
  const changePercent =
    price?.change_percent != null ? Number(price.change_percent) : null;
  const changeAmount =
    price?.change_amount != null ? Number(price.change_amount) : null;

  if (current == null || Number.isNaN(current)) {
    return <Text style={size === 'lg' ? styles.priceLg : styles.priceSm}>—</Text>;
  }

  const isUp = (changePercent ?? changeAmount ?? 0) >= 0;
  const changeColor = isUp ? colors.success : colors.danger;

  return (
    <View style={styles.row}>
      <Text style={size === 'lg' ? styles.priceLg : styles.priceSm}>
        {current.toFixed(2)}
      </Text>
      {changePercent != null && !Number.isNaN(changePercent) ? (
        <Text
          style={[
            size === 'lg' ? styles.changeLg : styles.changeSm,
            { color: changeColor },
          ]}
        >
          {isUp ? '+' : ''}
          {changePercent.toFixed(2)}%
        </Text>
      ) : null}
    </View>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
  row: { alignItems: 'flex-end' },
  priceSm: { fontSize: 14, fontWeight: '700', color: c.textPrimary },
  priceLg: { fontSize: 26, fontWeight: '800', color: c.textPrimary },
  changeSm: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  changeLg: { fontSize: 14, fontWeight: '700', marginTop: 2 },
});
