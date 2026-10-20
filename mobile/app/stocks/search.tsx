import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { goBackOr } from '@/lib/navigation';
import { stockHref } from '@/lib/stockLink';
import { useLocalizedField } from '@/lib/i18n-content';
import { useRTL } from '@/lib/rtl';
import {
  useAddToWatchlist,
  useRemoveFromWatchlist,
  useStockSearch,
  useWatchlist,
  watchlistErrorCode,
} from '@/hooks/useStocks';
import { StockRow } from '@/components/stocks/StockRow';
import type { AppColors } from '@/constants/colors';
import { useTheme } from '@/lib/theme';
import type { StockSummary } from '@/types/content';

const DEBOUNCE_MS = 250;

/**
 * Stock search. A stack screen rather than a tab: the app already has six
 * tabs, and search is something you arrive at from the home search bar.
 */
export default function StockSearchScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  const router = useRouter();
  const { isRTL } = useRTL();
  const getField = useLocalizedField();

  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term]);

  const search = useStockSearch(debounced);
  const watchlist = useWatchlist();
  const add = useAddToWatchlist();
  const remove = useRemoveFromWatchlist();

  const watchedSymbols = useMemo(
    () => new Set((watchlist.data ?? []).map((entry) => entry.symbol)),
    [watchlist.data]
  );

  function handleToggleWatch(symbol: string) {
    const isWatched = watchedSymbols.has(symbol);
    const mutation = isWatched ? remove : add;
    mutation.mutate(
      { symbol },
      {
        onError: (error) => {
          const code = watchlistErrorCode(error);
          Alert.alert(
            t('common.error_title'),
            code === 'WATCHLIST_LIMIT'
              ? t('stocks.limit_reached')
              : code === 'NOT_FOUND'
                ? t('stocks.not_covered')
                : t('stocks.update_failed')
          );
        },
      }
    );
  }

  const results: StockSummary[] = search.data ?? [];
  const hasTerm = debounced.length > 0;

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
          {t('stocks.search_title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchBox}>
        <View style={styles.inputWrapper}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            value={term}
            onChangeText={setTerm}
            placeholder={t('stocks.search_placeholder')}
            placeholderTextColor={colors.textMuted}
            autoFocus
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
          />
          {term.length > 0 ? (
            <TouchableOpacity onPress={() => setTerm('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
        {/* Permanent, in both languages: the universe is deliberately narrow. */}
        <Text style={styles.coverageNote}>{t('stocks.coverage_note')}</Text>
      </View>

      {!hasTerm ? (
        <View style={styles.centered}>
          <Text style={styles.hint}>{t('stocks.search_hint')}</Text>
        </View>
      ) : search.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primaryText} />
        </View>
      ) : (
        <FlashList
          data={results}
          keyExtractor={(item: StockSummary) => item.symbol}
          renderItem={({ item }: { item: StockSummary }) => (
            <StockRow
              symbol={item.symbol}
              name={getField(item, 'name')}
              isWatched={watchedSymbols.has(item.symbol)}
              onPress={() => router.push(stockHref(item.symbol) as never)}
              onToggleWatch={() => handleToggleWatch(item.symbol)}
              disabled={add.isPending || remove.isPending}
            />
          )}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>{t('stocks.no_results')}</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/chat')}>
                <Text style={styles.emptyAction}>{t('stocks.ask_in_chat')}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: c.backgroundSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: c.surface,
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
  searchBox: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.borderLight,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: c.inputBackground,
    borderWidth: 1,
    borderColor: c.borderLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: c.textPrimary,
    paddingVertical: 0,
  },
  coverageNote: {
    marginTop: 8,
    fontSize: 12,
    color: c.textMuted,
    lineHeight: 18,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  hint: { fontSize: 14, color: c.textMuted, textAlign: 'center' },
  listContent: { padding: 16 },
  emptyBox: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: c.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyAction: {
    fontSize: 14,
    fontWeight: '600',
    color: c.accent,
    textAlign: 'center',
  },
});
