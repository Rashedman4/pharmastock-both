import React, { useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Text,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useNews } from '@/hooks/useContent';
import { NewsCard } from '@/components/news/NewsCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import type { NewsItem } from '@/types/content';

export default function NewsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useNews();

  const allItems: NewsItem[] = data?.pages.flatMap((p) => p.data) ?? [];

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('news.title')}</Text>
      </View>

      {isError ? (
        <EmptyState icon="⚠️" title={t('common.error')} actionLabel={t('common.retry')} onAction={() => refetch()} />
      ) : (
        <FlatList
          data={allItems}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <NewsCard
              item={item}
              onPress={() => router.push(`/(tabs)/news/${item.id}` as never)}
            />
          )}
          contentContainerStyle={allItems.length === 0 ? styles.emptyContent : styles.listContent}
          ListEmptyComponent={<EmptyState icon="📰" title={t('news.empty')} />}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
            ) : null
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  listContent: { padding: 16 },
  emptyContent: { flex: 1, padding: 16 },
});
