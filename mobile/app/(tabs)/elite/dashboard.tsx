import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Ionicons } from '@expo/vector-icons';
import { EliteTabBar } from '@/components/elite/EliteTabBar';
import { Colors } from '@/constants/colors';
import { fetchEliteDashboard } from '@/services/elite.service';
import { rowDirection } from '@/lib/rtl';

function fmt(val: number | null | undefined): string {
  if (val == null) return '—';
  return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface MetricCardProps {
  label: string;
  value: string;
  accent?: boolean;
  positive?: boolean;
  negative?: boolean;
}

function MetricCard({ label, value, accent, positive, negative }: MetricCardProps) {
  const valueColor = positive
    ? Colors.success
    : negative
    ? Colors.danger
    : accent
    ? Colors.primary
    : Colors.text;

  return (
    <Card style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: valueColor }]}>{value}</Text>
    </Card>
  );
}

interface QuickLinkProps {
  label: string;
  count?: number;
  onPress: () => void;
}

function QuickLink({ label, count, onPress }: QuickLinkProps) {
  return (
    <TouchableOpacity style={styles.quickLink} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.quickLinkLabel}>{label}</Text>
      {count != null && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      )}
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

export default function EliteDashboardScreen() {
  const { t } = useTranslation();

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['elite-dashboard'],
    queryFn: fetchEliteDashboard,
    staleTime: 30_000,
  });

  if (isLoading) return <LoadingScreen />;

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('common.error')}</Text>
        <Button title={t('common.retry')} onPress={() => refetch()} variant="outline" containerStyle={{ marginTop: 12 }} />
      </View>
    );
  }

  const profitPositive = Number(data.overallProfit) >= 0;

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t('elite.dashboard')}</Text>
          <View style={[styles.headerActions, { flexDirection: rowDirection }]}>
            <TouchableOpacity onPress={() => refetch()} style={[styles.reloadBtn, { flexDirection: rowDirection }]} activeOpacity={0.7} disabled={isFetching}>
              <Ionicons name="refresh-outline" size={18} color={Colors.primary} style={isFetching ? styles.spinning : undefined} />
              <Text style={styles.reloadText}>{t('common.reload')}</Text>
            </TouchableOpacity>
            <Badge label={t('elite.active')} variant="success" />
          </View>
        </View>

        {data.linkedPartnerName && (
          <Card style={styles.partnerBanner}>
            <Text style={styles.partnerText}>{t('elite.partner_linked', { name: data.linkedPartnerName })}</Text>
          </Card>
        )}

        <Text style={styles.sectionTitle}>{t('elite.portfolio_overview')}</Text>

        <View style={styles.metricsGrid}>
          <MetricCard label={t('elite.total_equity')} value={fmt(data.totalEquity)} accent />
          <MetricCard label={t('elite.free_capital')} value={fmt(data.freeCapitalAmount)} />
          <MetricCard label={t('elite.money_in_market')} value={fmt(data.moneyInMarket)} />
          <MetricCard
            label={t('elite.overall_profit')}
            value={fmt(data.overallProfit)}
            positive={profitPositive && data.overallProfit !== 0}
            negative={!profitPositive}
          />
          <MetricCard label={t('elite.firm_profit_share')} value={fmt(data.firmProfit)} />
          <MetricCard
            label={t('elite.investor_profit')}
            value={fmt(data.investorProfit)}
            positive={Number(data.investorProfit) >= 0 && data.investorProfit !== 0}
            negative={Number(data.investorProfit) < 0}
          />
        </View>

        {data.feeNotice ? (
          <Text style={styles.feeNotice}>{data.feeNotice}</Text>
        ) : null}

        <Text style={styles.sectionTitle}>{t('elite.activity_section')}</Text>

        <Card>
          <QuickLink
            label={t('elite.trade_plans')}
            count={data.pendingPlans}
            onPress={() => router.push('/elite/trade-plans')}
          />
          <View style={styles.divider} />
          <QuickLink
            label={t('elite.portfolio_positions')}
            count={data.openPositions > 0 ? data.openPositions : undefined}
            onPress={() => router.push('/elite/portfolio')}
          />
          <View style={styles.divider} />
          <QuickLink
            label={t('elite.firm_profit')}
            onPress={() => Linking.openURL('https://biopharmastock.com/en/elite-group')}
          />
        </Card>

        <View style={{ height: 16 }} />
      </ScrollView>
      <EliteTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerActions: { alignItems: 'center', gap: 10 },
  reloadBtn: { alignItems: 'center', gap: 4 },
  reloadText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  spinning: { opacity: 0.4 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary, marginBottom: 12, marginTop: 8 },
  partnerBanner: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accent,
    marginBottom: 16,
  },
  partnerText: { color: Colors.accent, fontWeight: '600', fontSize: 13 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  metricCard: {
    width: '47%',
    marginBottom: 0,
    paddingVertical: 14,
  },
  metricLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', letterSpacing: 0.3, marginBottom: 6 },
  metricValue: { fontSize: 17, fontWeight: '800' },
  feeNotice: { fontSize: 11, color: Colors.textMuted, marginBottom: 16, fontStyle: 'italic' },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  quickLinkLabel: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },
  countBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 8,
  },
  countText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  arrow: { fontSize: 20, color: Colors.textMuted },
  divider: { height: 1, backgroundColor: Colors.borderLight },
  errorText: { fontSize: 16, color: Colors.danger },
});
