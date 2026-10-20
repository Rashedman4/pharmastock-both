import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { goBackOr } from '@/lib/navigation';
import { useLocalizedField } from '@/lib/i18n-content';
import { useRTL } from '@/lib/rtl';
import { formatDate } from '@/lib/format';
import {
  useAddToWatchlist,
  useRemoveFromWatchlist,
  useSetWatchAlerts,
  useStockDetail,
  watchlistErrorCode,
} from '@/hooks/useStocks';
import { PriceTag } from '@/components/stocks/PriceTag';
import { AutoText } from '@/components/ui/AutoText';
import { SectionHeader } from '@/components/ui/SectionHeader';
import type { AppColors } from '@/constants/colors';
import { useTheme } from '@/lib/theme';

/**
 * One stock: what we know about it and everything we have published on it.
 *
 * The whole screen comes from a single request (`/stocks/[symbol]`), including
 * the cached price and the caller's watch state.
 */
export default function StockDetailScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { symbol: rawSymbol } = useLocalSearchParams<{ symbol: string }>();
  const symbol = (rawSymbol ?? '').toUpperCase();
  const router = useRouter();
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const getField = useLocalizedField();

  const { data: stock, isLoading, isError } = useStockDetail(symbol);
  const add = useAddToWatchlist();
  const remove = useRemoveFromWatchlist();
  const setAlerts = useSetWatchAlerts();

  const busy = add.isPending || remove.isPending || setAlerts.isPending;

  function onMutationError(error: unknown) {
    const code = watchlistErrorCode(error);
    Alert.alert(
      t('common.error_title'),
      code === 'WATCHLIST_LIMIT'
        ? t('stocks.limit_reached')
        : code === 'NOT_FOUND'
          ? t('stocks.not_covered')
          : t('stocks.update_failed')
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primaryText} />
      </View>
    );
  }

  if (isError || !stock) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t('stocks.not_covered')}</Text>
        <TouchableOpacity onPress={() => goBackOr('/(tabs)/home')}>
          <Text style={styles.backLink}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const name = getField(stock, 'name');

  function handleToggleWatch() {
    const mutation = stock?.is_watched ? remove : add;
    mutation.mutate({ symbol }, { onError: onMutationError });
  }

  function handleToggleAlerts() {
    setAlerts.mutate(
      { symbol, alertsEnabled: !stock?.alerts_enabled },
      { onError: onMutationError }
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => goBackOr('/(tabs)/home')}
          style={styles.backBtn}
        >
          <Ionicons
            name={isRTL ? 'chevron-forward' : 'chevron-back'}
            size={26}
            color={colors.primaryText}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {stock.symbol}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.summaryText}>
              <Text style={styles.symbol}>{stock.symbol}</Text>
              {name && name !== stock.symbol ? (
                <AutoText style={styles.name} numberOfLines={2}>
                  {name}
                </AutoText>
              ) : null}
            </View>
            {stock.price ? (
              <PriceTag price={stock.price} size="lg" />
            ) : (
              <Text style={styles.noPrice}>{t('stocks.no_price')}</Text>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, stock.is_watched && styles.actionBtnActive]}
              onPress={handleToggleWatch}
              disabled={busy}
              activeOpacity={0.7}
            >
              <Ionicons
                name={stock.is_watched ? 'star' : 'star-outline'}
                size={18}
                color={stock.is_watched ? colors.white : colors.primaryText}
              />
              <Text
                style={[
                  styles.actionText,
                  stock.is_watched && styles.actionTextActive,
                ]}
              >
                {stock.is_watched ? t('stocks.watching') : t('stocks.watch')}
              </Text>
            </TouchableOpacity>

            {/* The bell only makes sense once the stock is followed. */}
            {stock.is_watched ? (
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  stock.alerts_enabled && styles.actionBtnActive,
                ]}
                onPress={handleToggleAlerts}
                disabled={busy}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    stock.alerts_enabled
                      ? 'notifications'
                      : 'notifications-off-outline'
                  }
                  size={18}
                  color={stock.alerts_enabled ? colors.white : colors.primaryText}
                />
                <Text
                  style={[
                    styles.actionText,
                    stock.alerts_enabled && styles.actionTextActive,
                  ]}
                >
                  {stock.alerts_enabled
                    ? t('stocks.alerts_on')
                    : t('stocks.alerts_off')}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {stock.is_watched ? (
            <Text style={styles.alertsHint}>{t('stocks.alerts_hint')}</Text>
          ) : null}
        </View>

        <Section title={t('announcements.title')}>
          {stock.announcements.length === 0 ? (
            <EmptyRow label={t('stocks.section_empty')} />
          ) : (
            stock.announcements.map((item) => (
              <ContentRow
                key={`announcement-${item.id}`}
                title={getField(item, 'title')}
                date={item.published_date}
                onPress={() =>
                  router.push(`/(tabs)/announcements/${item.id}` as never)
                }
              />
            ))
          )}
        </Section>

        <Section title={t('dailyUpdates.title')}>
          {stock.daily_updates.length === 0 ? (
            <EmptyRow label={t('stocks.section_empty')} />
          ) : (
            stock.daily_updates.map((item) => (
              <ContentRow
                key={`daily-${item.id}`}
                title={getField(item, 'subtitle') || stock.symbol}
                date={item.published_date}
                onPress={() =>
                  router.push(`/(tabs)/daily-updates/${item.id}` as never)
                }
              />
            ))
          )}
        </Section>

        <Section title={t('breakthroughs.title')}>
          {stock.breakthroughs.length === 0 ? (
            <EmptyRow label={t('stocks.section_empty')} />
          ) : (
            stock.breakthroughs.map((item) => (
              <ContentRow
                key={`breakthrough-${item.id}`}
                title={getField(item, 'title')}
                date={item.created_at}
                onPress={() =>
                  router.push(`/(tabs)/breakthroughs/${item.id}` as never)
                }
              />
            ))
          )}
        </Section>

        <Section title={t('news.title')}>
          {stock.news.length === 0 ? (
            <EmptyRow label={t('stocks.section_empty')} />
          ) : (
            stock.news.map((item) => (
              <ContentRow
                key={`news-${item.id}`}
                title={getField(item, 'title')}
                date={item.published_date}
                onPress={() => router.push(`/(tabs)/news/${item.id}` as never)}
              />
            ))
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.section}>
      <SectionHeader title={title} />
      {children}
    </View>
  );
}

function ContentRow({
  title,
  date,
  onPress,
}: {
  title: string;
  date: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <TouchableOpacity style={styles.contentRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.contentRowText}>
        <AutoText style={styles.contentRowTitle} numberOfLines={2}>
          {title}
        </AutoText>
        <Text style={styles.contentRowDate}>{formatDate(date)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function EmptyRow({ label }: { label: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return <Text style={styles.emptyRow}>{label}</Text>;
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: c.backgroundSecondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.borderLight,
  },
  backBtn: { width: 40, justifyContent: 'center' },
  headerSpacer: { width: 40 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.primaryText,
    flex: 1,
    textAlign: 'center',
  },
  content: { padding: 16, paddingBottom: 32 },

  summaryCard: {
    backgroundColor: c.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.borderLight,
    padding: 16,
  },
  summaryTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  summaryText: { flex: 1 },
  symbol: {
    fontSize: 22,
    fontWeight: '800',
    color: c.primaryText,
    letterSpacing: 0.5,
  },
  name: { fontSize: 14, color: c.textSecondary, marginTop: 4 },
  noPrice: { fontSize: 13, color: c.textMuted },

  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: c.primary,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionBtnActive: {
    backgroundColor: c.primary,
  },
  actionText: { fontSize: 13, fontWeight: '600', color: c.primaryText },
  actionTextActive: { color: c.white },
  alertsHint: {
    marginTop: 12,
    fontSize: 12,
    color: c.textMuted,
    lineHeight: 18,
  },

  section: { marginTop: 20 },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: c.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  contentRowText: { flex: 1 },
  contentRowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textPrimary,
    lineHeight: 20,
  },
  contentRowDate: { fontSize: 12, color: c.textMuted, marginTop: 4 },
  emptyRow: {
    fontSize: 13,
    color: c.textMuted,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 15,
    color: c.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  backLink: { color: c.accent, fontWeight: '600' },
});
