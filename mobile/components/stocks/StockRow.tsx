import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AutoText } from '@/components/ui/AutoText';
import { PriceTag } from '@/components/stocks/PriceTag';
import type { AppColors } from '@/constants/colors';
import { useTheme } from '@/lib/theme';
import type { CachedPrice } from '@/types/content';

interface Props {
  symbol: string;
  /** Already localized by the caller (Arabic name when present). */
  name: string;
  price?: CachedPrice | null;
  isWatched: boolean;
  onPress: () => void;
  onToggleWatch: () => void;
  disabled?: boolean;
}

/**
 * One stock in a list: symbol, name, optional cached price and a star.
 *
 * Used by both the search screen and the home watchlist, so the two stay
 * visually identical.
 */
export const StockRow = React.memo(function StockRow({
  symbol,
  name,
  price,
  isWatched,
  onPress,
  onToggleWatch,
  disabled,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.main}>
        <Text style={styles.symbol}>{symbol}</Text>
        {name && name !== symbol ? (
          <AutoText style={styles.name} numberOfLines={1}>
            {name}
          </AutoText>
        ) : null}
      </View>

      {price !== undefined ? <PriceTag price={price} /> : null}

      <TouchableOpacity
        onPress={onToggleWatch}
        disabled={disabled}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.star}
      >
        <Ionicons
          name={isWatched ? 'star' : 'star-outline'}
          size={22}
          color={isWatched ? colors.warning : colors.textMuted}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: c.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  main: { flex: 1 },
  symbol: {
    fontSize: 15,
    fontWeight: '700',
    color: c.primaryText,
    letterSpacing: 0.5,
  },
  name: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
  star: { paddingLeft: 4 },
});
