import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { EliteTabBar } from '@/components/elite/EliteTabBar';
import { Colors } from '@/constants/colors';
import { fetchTradePlans } from '@/services/elite.service';
import type { TradePlan } from '@/types/elite';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary';

const STATUS_FILTERS = ['ALL', 'SENT', 'ACCEPTED_BY_INVESTOR', 'EXECUTED', 'CLOSED'];

function planStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    SENT: 'info',
    ACCEPTED_BY_INVESTOR: 'success',
    REJECTED_BY_INVESTOR: 'danger',
    EXECUTED: 'primary',
    CANCELLED: 'neutral',
    CLOSED: 'neutral',
    DRAFT: 'neutral',
  };
  return map[status] ?? 'neutral';
}

function TradePlanCard({ item }: { item: TradePlan }) {
  const { t } = useTranslation();
  const needsAction =
    item.status === 'SENT' ||
    (item.status === 'ACCEPTED_BY_INVESTOR' && !item.execution_id);

  return (
    <Card onPress={() => router.push(`/elite/trade-plans/${item.id}`)}>
      {needsAction && (
        <View style={styles.actionBanner}>
          <Text style={styles.actionText}>
            {item.status === 'SENT' ? '⚡ Awaiting your response' : '⚡ Ready to execute'}
          </Text>
        </View>
      )}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.symbol}>{item.symbol}</Text>
          {item.company_name ? (
            <Text style={styles.company}>{item.company_name}</Text>
          ) : null}
        </View>
        <View style={styles.badges}>
          <Badge
            label={item.plan_side === 'LONG' ? t('elite.long') : t('elite.short')}
            variant={item.plan_side === 'LONG' ? 'success' : 'danger'}
          />
          <Badge label={item.status.replace(/_/g, ' ')} variant={planStatusVariant(item.status)} />
        </View>
      </View>

      <View style={styles.priceRow}>
        {item.target_entry_price && (
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>{t('elite.entry')}</Text>
            <Text style={styles.priceValue}>${Number(item.target_entry_price).toFixed(2)}</Text>
          </View>
        )}
        {item.target_price_1 && (
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>{t('elite.target_1')}</Text>
            <Text style={[styles.priceValue, { color: Colors.success }]}>
              ${Number(item.target_price_1).toFixed(2)}
            </Text>
          </View>
        )}
        {item.stop_loss_price && (
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>{t('elite.stop_loss')}</Text>
            <Text style={[styles.priceValue, { color: Colors.danger }]}>
              ${Number(item.stop_loss_price).toFixed(2)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.qty}>
          {t('elite.quantity')}: {Number(item.suggested_quantity).toLocaleString()}
        </Text>
        <Text style={styles.date}>{new Date(item.planned_at).toLocaleDateString()}</Text>
      </View>
    </Card>
  );
}

export default function TradePlansScreen() {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState('ALL');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['elite-trade-plans', activeFilter],
    queryFn: () => fetchTradePlans(1, 50, activeFilter === 'ALL' ? undefined : activeFilter),
    staleTime: 30_000,
  });

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(s) => s}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, activeFilter === item && styles.chipActive]}
              onPress={() => setActiveFilter(item)}
            >
              <Text style={[styles.chipText, activeFilter === item && styles.chipTextActive]}>
                {item === 'ALL' ? 'All' : item.replace(/_/g, ' ')}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : error ? (
        <EmptyState
          title={t('common.error')}
          actionLabel={t('common.retry')}
          onAction={refetch}
        />
      ) : !data?.data?.length ? (
        <EmptyState title={t('elite.no_plans')} />
      ) : (
        <FlatList
          data={data.data}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <TradePlanCard item={item} />}
          contentContainerStyle={styles.list}
        />
      )}

      <EliteTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filters: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },
  list: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  symbol: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  company: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  badges: { gap: 4, alignItems: 'flex-end' },
  priceRow: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  priceItem: {},
  priceLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  priceValue: { fontSize: 14, fontWeight: '700', color: Colors.text },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  qty: { fontSize: 12, color: Colors.textSecondary },
  date: { fontSize: 12, color: Colors.textMuted },
  actionBanner: {
    backgroundColor: '#FFF8E1',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  actionText: { fontSize: 11, fontWeight: '700', color: '#B45309' },
});
