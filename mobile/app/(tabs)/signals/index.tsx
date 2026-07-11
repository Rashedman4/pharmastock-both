import React, { useCallback, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Text,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useOpenSignals, useSignalHistory } from '@/hooks/useSignals';
import { SignalCard } from '@/components/signals/SignalCard';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { Colors } from '@/constants/colors';
import { rowDirection } from '@/lib/rtl';
import type { Signal, SignalHistoryItem } from '@/types/content';

type Tab = 'open' | 'history';

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmt(v: string | null) {
  if (!v) return '—';
  const n = parseFloat(v);
  return isNaN(n) ? '—' : `$${n.toFixed(2)}`;
}

function HistoryRow({ item }: { item: SignalHistoryItem }) {
  const { t } = useTranslation();
  return (
    <View style={styles.historyRow}>
      <View>
        <Text style={styles.historySymbol}>{item.symbol}</Text>
        <Text style={styles.historyDates}>
          {formatDate(item.entrance_date)} → {formatDate(item.closing_date)}
        </Text>
      </View>
      <View style={styles.historyRight}>
        <View style={styles.priceRow}>
          <Text style={styles.priceIn}>{fmt(item.in_price)}</Text>
          <Text style={styles.arrow}> → </Text>
          <Text style={styles.priceOut}>{fmt(item.out_price)}</Text>
        </View>
        <Badge
          label={item.success ? t('signals.success') : t('signals.closed')}
          variant={item.success ? 'success' : 'danger'}
        />
      </View>
    </View>
  );
}

export default function SignalsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('open');

  const openQuery = useOpenSignals();
  const historyQuery = useSignalHistory();

  const query = activeTab === 'open' ? openQuery : historyQuery;

  const allItems: (Signal | SignalHistoryItem)[] =
    activeTab === 'open'
      ? (openQuery.data?.pages.flatMap((p) => p.data as Signal[]) ?? [])
      : (historyQuery.data?.pages.flatMap((p) => p.data as SignalHistoryItem[]) ?? []);

  const onEndReached = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
  }, [query]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Screen header */}
      <View style={[styles.header, { flexDirection: rowDirection }]}>
        <Text style={styles.headerTitle}>{t('signals.title')}</Text>
        <LanguageToggle style={styles.languageToggle} />
      </View>

      {/* Segmented control */}
      <View style={styles.segmented}>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'open' && styles.segmentActive]}
          onPress={() => setActiveTab('open')}
        >
          <Text style={[styles.segmentText, activeTab === 'open' && styles.segmentTextActive]}>
            {t('signals.open_signals')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'history' && styles.segmentActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.segmentText, activeTab === 'history' && styles.segmentTextActive]}>
            {t('signals.history')}
          </Text>
        </TouchableOpacity>
      </View>

      {query.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : query.isError ? (
        <EmptyState
          title={t('common.error')}
          actionLabel={t('common.retry')}
          onAction={() => query.refetch()}
        />
      ) : (
        <FlatList
          key={activeTab}
          data={allItems}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) =>
            activeTab === 'open' ? (
              <SignalCard
                signal={item as unknown as Signal}
                onPress={() =>
                  router.push(`/(tabs)/signals/${item.id}` as never)
                }
              />
            ) : (
              <HistoryRow item={item as unknown as SignalHistoryItem} />
            )
          }
          contentContainerStyle={
            allItems.length === 0 ? styles.emptyContent : styles.listContent
          }
          ListEmptyComponent={
            <EmptyState
              title={
                activeTab === 'open' ? t('signals.empty') : t('signals.history_empty')
              }
            />
          }
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
            ) : null
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
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

  // History row
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  historySymbol: { fontSize: 16, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  historyDates: { fontSize: 12, color: Colors.textMuted },
  historyRight: { alignItems: 'flex-end', gap: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  priceIn: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  arrow: { fontSize: 12, color: Colors.textMuted },
  priceOut: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
});
