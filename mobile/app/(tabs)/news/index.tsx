import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useNews, useDailyUpdates } from '@/hooks/useContent';
import { NewsCard } from '@/components/news/NewsCard';
import { DailyUpdateCard } from '@/components/dailyUpdates/DailyUpdateCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { Colors } from '@/constants/colors';
import { rowDirection } from '@/lib/rtl';
import type { NewsItem, DailyUpdateItem } from '@/types/content';

type Tab = 'news' | 'daily-updates';

export default function NewsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('news');

  const newsQuery = useNews();
  const dailyUpdatesQuery = useDailyUpdates();

  const query = activeTab === 'news' ? newsQuery : dailyUpdatesQuery;

  const allItems: (NewsItem | DailyUpdateItem)[] =
    activeTab === 'news'
      ? (newsQuery.data?.pages.flatMap((p) => p.data as NewsItem[]) ?? [])
      : (dailyUpdatesQuery.data?.pages.flatMap((p) => p.data as DailyUpdateItem[]) ?? []);

  const onEndReached = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
  }, [query]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { flexDirection: rowDirection }]}>
        <Text style={styles.headerTitle}>{t('news.title')}</Text>
        <LanguageToggle style={styles.languageToggle} />
      </View>

      {/* Segmented control */}
      <View style={styles.segmented}>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'news' && styles.segmentActive]}
          onPress={() => setActiveTab('news')}
        >
          <Text style={[styles.segmentText, activeTab === 'news' && styles.segmentTextActive]}>
            {t('news.tab_news')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'daily-updates' && styles.segmentActive]}
          onPress={() => setActiveTab('daily-updates')}
        >
          <Text style={[styles.segmentText, activeTab === 'daily-updates' && styles.segmentTextActive]}>
            {t('news.tab_daily_updates')}
          </Text>
        </TouchableOpacity>
      </View>

      {query.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : query.isError ? (
        <EmptyState title={t('common.error')} actionLabel={t('common.retry')} onAction={() => query.refetch()} />
      ) : (
        <FlashList
          key={activeTab}
          data={allItems}
          keyExtractor={(item: NewsItem | DailyUpdateItem) => String(item.id)}
          renderItem={({ item }: { item: NewsItem | DailyUpdateItem }) =>
            activeTab === 'news' ? (
              <NewsCard
                item={item as NewsItem}
                onPress={() => router.push(`/(tabs)/news/${item.id}` as never)}
              />
            ) : (
              <DailyUpdateCard
                item={item as DailyUpdateItem}
                onPress={() => router.push(`/(tabs)/daily-updates/${item.id}` as never)}
              />
            )
          }
          contentContainerStyle={allItems.length === 0 ? styles.emptyContent : styles.listContent}
          ListEmptyComponent={
            <EmptyState title={activeTab === 'news' ? t('news.empty') : t('dailyUpdates.empty')} />
          }
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
            ) : null
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          refreshing={query.isRefetching}
          onRefresh={() => query.refetch()}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  languageToggle: { marginBottom: 0 },

  // Segmented control
  segmented: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  segmentActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.white,
  },

  listContent: { padding: 16 },
  emptyContent: { flex: 1, padding: 16 },
});
