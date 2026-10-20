import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  TextInput,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useNews, useDailyUpdates, useAvailableDates } from '@/hooks/useContent';
import { useAnnouncements } from '@/hooks/useStocks';
import { NewsCard } from '@/components/news/NewsCard';
import { DailyUpdateCard } from '@/components/dailyUpdates/DailyUpdateCard';
import { AnnouncementCard } from '@/components/announcements/AnnouncementCard';
import { DaySelector } from '@/components/dailyUpdates/DaySelector';
import { Ionicons } from '@expo/vector-icons';
import { addDays, todayKey, MAX_HISTORY_DAYS } from '@/lib/day';
import { EmptyState } from '@/components/ui/EmptyState';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import type { AppColors } from '@/constants/colors';
import { useTheme } from '@/lib/theme';
import type {
  AnnouncementSummary,
  NewsItem,
  DailyUpdateItem,
} from '@/types/content';

type Tab = 'news' | 'daily-updates' | 'announcements';
type ListItem = NewsItem | DailyUpdateItem | AnnouncementSummary;

const TABS: { key: Tab; labelKey: string }[] = [
  { key: 'news', labelKey: 'news.tab_news' },
  { key: 'daily-updates', labelKey: 'news.tab_daily_updates' },
  { key: 'announcements', labelKey: 'news.tab_announcements' },
];

export default function NewsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('news');
  // Selected day for the Daily Updates segment; defaults to today so the tab
  // opens on today's items with no extra tap.
  const [selectedDay, setSelectedDay] = useState<string>(() => todayKey());
  // Symbol filter for the News segment — the same search the web news page
  // has. Submitted rather than debounced, so one tap = one query.
  const [symbolInput, setSymbolInput] = useState('');
  const [activeSymbol, setActiveSymbol] = useState('');

  // A notification tap can land here with a segment (and a day) to open.
  // This runs on every params change, not just on mount, because the tab is
  // usually already mounted when the push arrives.
  const params = useLocalSearchParams<{ tab?: string; date?: string }>();
  useEffect(() => {
    if (!params.tab && !params.date) return;

    if (
      params.tab === 'news' ||
      params.tab === 'daily-updates' ||
      params.tab === 'announcements'
    ) {
      setActiveTab(params.tab);
    }
    if (params.date) setSelectedDay(params.date);

    // Clear them so coming back to this tab later doesn't re-apply a stale
    // day. Empty strings rather than undefined: setParams is typed for string
    // values, and the guard above treats empty as absent.
    router.setParams({ tab: '', date: '' });
  }, [params.tab, params.date, router]);

  const newsQuery = useNews(activeSymbol);
  const dailyUpdatesQuery = useDailyUpdates(selectedDay);
  const announcementsQuery = useAnnouncements();

  const historyStart = useMemo(() => addDays(todayKey(), -(MAX_HISTORY_DAYS - 1)), []);
  const availableDatesQuery = useAvailableDates(historyStart, todayKey());
  const availableDates = useMemo(
    () => (availableDatesQuery.data ? new Set(availableDatesQuery.data.map((d) => d.date)) : undefined),
    [availableDatesQuery.data]
  );

  const query =
    activeTab === 'news'
      ? newsQuery
      : activeTab === 'daily-updates'
        ? dailyUpdatesQuery
        : announcementsQuery;

  const allItems: ListItem[] =
    activeTab === 'news'
      ? (newsQuery.data?.pages.flatMap((p) => p.data as NewsItem[]) ?? [])
      : activeTab === 'daily-updates'
        ? (dailyUpdatesQuery.data?.pages.flatMap((p) => p.data as DailyUpdateItem[]) ?? [])
        : (announcementsQuery.data?.pages.flatMap((p) => p.data as AnnouncementSummary[]) ?? []);

  const onEndReached = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
  }, [query]);

  const emptyTitle =
    activeTab === 'news'
      ? activeSymbol
        ? t('news.empty_for_symbol')
        : t('news.empty')
      : activeTab === 'daily-updates'
        ? t('dailyUpdates.empty_for_day')
        : t('announcements.empty');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('news.title')}</Text>
        <LanguageToggle style={styles.languageToggle} />
      </View>

      {/* Segmented control */}
      <View style={styles.segmented}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.segment, activeTab === tab.key && styles.segmentActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === tab.key && styles.segmentTextActive,
              ]}
              numberOfLines={1}
            >
              {t(tab.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'news' && (
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={symbolInput}
              onChangeText={(value) => setSymbolInput(value.toUpperCase())}
              placeholder={t('news.search_symbol_placeholder')}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => setActiveSymbol(symbolInput.trim())}
            />
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setActiveSymbol(symbolInput.trim())}
          >
            <Text style={styles.searchButtonText}>{t('news.search')}</Text>
          </TouchableOpacity>
          {activeSymbol ? (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSymbolInput('');
                setActiveSymbol('');
              }}
            >
              <Text style={styles.clearButtonText}>{t('news.clear_search')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {activeTab === 'news' && activeSymbol ? (
        <Text style={styles.resultsFor}>
          {t('news.results_for_symbol')} <Text style={styles.resultsSymbol}>{activeSymbol}</Text>
        </Text>
      ) : null}

      {activeTab === 'daily-updates' && (
        <DaySelector
          value={selectedDay}
          onChange={setSelectedDay}
          availableDates={availableDates}
        />
      )}

      {query.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primaryText} />
        </View>
      ) : query.isError ? (
        <EmptyState title={t('common.error')} actionLabel={t('common.retry')} onAction={() => query.refetch()} />
      ) : (
        <View style={styles.listWrapper}>
          <FlashList
            key={activeTab === 'daily-updates' ? `daily-updates-${selectedDay}` : activeTab}
            data={allItems}
            keyExtractor={(item: ListItem) => String(item.id)}
            renderItem={({ item }: { item: ListItem }) =>
              activeTab === 'news' ? (
                <NewsCard
                  item={item as NewsItem}
                  onPress={() => router.push(`/(tabs)/news/${item.id}` as never)}
                />
              ) : activeTab === 'daily-updates' ? (
                <DailyUpdateCard
                  item={item as DailyUpdateItem}
                  onPress={() => router.push(`/(tabs)/daily-updates/${item.id}` as never)}
                />
              ) : (
                <AnnouncementCard
                  item={item as AnnouncementSummary}
                  onPress={() => router.push(`/(tabs)/announcements/${item.id}` as never)}
                />
              )
            }
            contentContainerStyle={allItems.length === 0 ? styles.emptyContent : styles.listContent}
            ListEmptyComponent={<EmptyState title={emptyTitle} />}
            ListFooterComponent={
              query.isFetchingNextPage ? (
                <ActivityIndicator color={colors.primaryText} style={{ marginVertical: 16 }} />
              ) : null
            }
            onEndReached={onEndReached}
            onEndReachedThreshold={0.3}
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
          />
          {activeTab === 'daily-updates' && dailyUpdatesQuery.isPlaceholderData ? (
            <View style={styles.loadingOverlay} pointerEvents="none">
              <ActivityIndicator color={colors.primaryText} />
            </View>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: c.backgroundSecondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  headerTitle: { fontSize: 22, fontWeight: '800', color: c.primaryText },
  languageToggle: { marginBottom: 0 },

  // Segmented control
  segmented: {
    flexDirection: 'row',
    backgroundColor: c.surface,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: c.borderLight,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: c.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  segmentActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: c.textSecondary,
  },
  segmentTextActive: {
    color: c.white,
  },

  // Symbol search (News segment)
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.borderLight,
    backgroundColor: c.inputBackground,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: c.textPrimary,
    paddingVertical: 0,
  },
  searchButton: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: c.accent,
  },
  searchButtonText: { fontSize: 13, fontWeight: '700', color: c.white },
  clearButton: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.borderLight,
  },
  clearButtonText: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
  resultsFor: {
    fontSize: 12,
    color: c.textMuted,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  resultsSymbol: { fontWeight: '700', color: c.primaryText },

  listContent: { padding: 16 },
  emptyContent: { flex: 1, padding: 16 },
  listWrapper: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.backgroundSecondary + 'B3',
  },
});
