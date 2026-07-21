import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useBreakthroughs } from '@/hooks/useContent';
import { BreakthroughCard } from '@/components/breakthroughs/BreakthroughCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import { isRTL, rowDirection } from '@/lib/rtl';
import type { Breakthrough } from '@/types/content';

type CategoryFilter = 'all' | 'drug' | 'therapy' | 'device';
type StageFilter = 'all' | 'research' | 'clinical' | 'approved';

export default function BreakthroughsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [stage, setStage] = useState<StageFilter>('all');

  const filters = {
    ...(category !== 'all' ? { category } : {}),
    ...(stage !== 'all' ? { stage } : {}),
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useBreakthroughs(filters);

  const allItems: Breakthrough[] = data?.pages.flatMap((p) => p.data) ?? [];

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const categories: CategoryFilter[] = ['all', 'drug', 'therapy', 'device'];
  const stages: StageFilter[] = ['all', 'research', 'clinical', 'approved'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { flexDirection: rowDirection }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>{isRTL ? '›' : '‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('breakthroughs.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filters}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={{ flexDirection: rowDirection }}
        >
          {categories.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, category === c && styles.chipActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>
                {t(`breakthroughs.${c}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.filterScroll, { marginTop: 6 }]}
          contentContainerStyle={{ flexDirection: rowDirection }}
        >
          {stages.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, stage === s && styles.chipActive]}
              onPress={() => setStage(s)}
            >
              <Text style={[styles.chipText, stage === s && styles.chipTextActive]}>
                {t(`breakthroughs.${s}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : isError ? (
        <EmptyState title={t('common.error')} actionLabel={t('common.retry')} onAction={() => refetch()} />
      ) : (
        <FlashList
          data={allItems}
          keyExtractor={(item: Breakthrough) => String(item.id)}
          renderItem={({ item }: { item: Breakthrough }) => (
            <BreakthroughCard
              item={item}
              onPress={() => router.push(`/breakthroughs/${item.id}` as never)}
            />
          )}
          contentContainerStyle={allItems.length === 0 ? styles.emptyContent : styles.listContent}
          ListEmptyComponent={<EmptyState title={t('breakthroughs.empty')} />}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
            ) : null
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          refreshing={isRefetching}
          onRefresh={refetch}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { width: 40, justifyContent: 'center' },
  backArrow: { fontSize: 28, color: Colors.primary },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  filters: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  filterScroll: {},
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginEnd: 8,
    backgroundColor: Colors.white,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  listContent: { padding: 16 },
  emptyContent: { flex: 1, padding: 16 },
});
