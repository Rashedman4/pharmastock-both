import React from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import { fetchExecutions } from '@/services/elite.service';
import type { TradeExecution } from '@/types/elite';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary';

function execStatusVariant(status: string): BadgeVariant {
  if (status === 'OPENED') return 'success';
  if (status === 'CANCELLED') return 'danger';
  return 'info';
}

function ExecutionCard({ item }: { item: TradeExecution }) {
  const { t } = useTranslation();
  return (
    <Card>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.symbol}>{item.symbol}</Text>
          {item.company_name && <Text style={styles.company}>{item.company_name}</Text>}
        </View>
        <View style={styles.badges}>
          <Badge
            label={item.plan_side === 'LONG' ? t('elite.long') : t('elite.short')}
            variant={item.plan_side === 'LONG' ? 'success' : 'danger'}
          />
          <Badge label={item.status} variant={execStatusVariant(item.status)} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.colLabel}>Executed Price</Text>
          <Text style={styles.colValue}>${Number(item.executed_price).toFixed(4)}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.colLabel}>Quantity</Text>
          <Text style={styles.colValue}>{Number(item.executed_quantity).toLocaleString()}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.colLabel}>Date</Text>
          <Text style={styles.colValue}>{new Date(item.executed_at).toLocaleDateString()}</Text>
        </View>
      </View>

      {item.investor_note && (
        <Text style={styles.note}>{item.investor_note}</Text>
      )}
    </Card>
  );
}

export default function ExecutionsScreen() {
  const { t } = useTranslation();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['elite-executions'],
    queryFn: () => fetchExecutions(1, 50),
    staleTime: 30_000,
  });

  if (isLoading) return <ActivityIndicator style={{ marginTop: 60 }} color={Colors.primary} />;

  if (error) {
    return (
      <EmptyState
        title={t('common.error')}
        actionLabel={t('common.retry')}
        onAction={refetch}
      />
    );
  }

  return (
    <View style={styles.container}>
      {!data?.data?.length ? (
        <EmptyState title={t('elite.no_executions')} />
      ) : (
        <FlatList
          data={data.data}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ExecutionCard item={item} />}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  symbol: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  company: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  badges: { gap: 4, alignItems: 'flex-end' },
  row: { flexDirection: 'row', gap: 16 },
  col: { flex: 1 },
  colLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', marginBottom: 2 },
  colValue: { fontSize: 14, fontWeight: '700', color: Colors.text },
  note: { marginTop: 8, fontSize: 12, color: Colors.textSecondary, fontStyle: 'italic' },
});
