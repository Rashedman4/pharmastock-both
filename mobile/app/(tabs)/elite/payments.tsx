import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useFocusEffect } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import { formatDate, formatNumber } from '@/lib/format';
import { fetchFirmProfitPayments, requestPaymentHandoff } from '@/services/elite.service';
import { firmPaymentStatusLabel } from '@/lib/eliteStatus';
import type { FirmProfitPayment } from '@/types/elite';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary';

function paymentStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    PENDING: 'neutral',
    CHECKOUT_CREATED: 'info',
    AWAITING_TRANSFER: 'warning',
    PROOF_SUBMITTED: 'warning',
    UNDER_REVIEW: 'warning',
    PAID: 'success',
    REJECTED: 'danger',
    FAILED: 'danger',
    EXPIRED: 'danger',
    CANCELLED: 'neutral',
  };
  return map[status] ?? 'neutral';
}

function PaymentCard({ item }: { item: FirmProfitPayment }) {
  const { t } = useTranslation();
  const status = String(item.status || '').toUpperCase();
  return (
    <Card>
      <View style={styles.cardHeader}>
        <Text style={styles.amount}>{formatNumber(item.amount_requested, { style: 'currency', currency: item.currency || 'USD' })}</Text>
        <Badge label={firmPaymentStatusLabel(status, t)} variant={paymentStatusVariant(status)} />
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.colLabel}>{t('elite.payment_method')}</Text>
          <Text style={styles.colValue}>{item.payment_method}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.colLabel}>{t('elite.amount_paid')}</Text>
          <Text style={styles.colValue}>{formatNumber(item.amount_paid, { style: 'currency', currency: item.currency || 'USD' })}</Text>
        </View>
      </View>

      <Text style={styles.date}>{formatDate(item.created_at)}</Text>
    </Card>
  );
}

export default function PaymentsScreen() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['elite-firm-profit-payments'],
    queryFn: () => fetchFirmProfitPayments(1, 20),
    staleTime: 30_000,
  });

  // Close any in-app browser sheet still open behind us when we're returned to
  // via the pharmastock://elite/payments deep link. dismissBrowser() is iOS-only
  // (SFSafariViewController); Android's Custom Tabs have no equivalent API and
  // close on their own when the user navigates back.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'ios') {
        try {
          WebBrowser.dismissBrowser();
        } catch {
          // no-op — nothing to dismiss
        }
      }
      qc.invalidateQueries({ queryKey: ['elite-firm-profit-payments'] });
    }, [qc])
  );

  const handlePayNow = async () => {
    try {
      const { url } = await requestPaymentHandoff();
      await WebBrowser.openBrowserAsync(url);
      qc.invalidateQueries({ queryKey: ['elite-firm-profit-payments'] });
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? t('common.error');
      Alert.alert(t('common.error_title'), msg);
    }
  };

  if (isLoading) return <ActivityIndicator style={{ marginTop: 60 }} color={Colors.primary} />;

  return (
    <View style={styles.container}>
      <View style={styles.payBar}>
        <Text style={styles.payHint}>{t('elite.pay_now_hint')}</Text>
        <Button
          title={t('elite.pay_now')}
          onPress={handlePayNow}
          containerStyle={{ marginTop: 10 }}
        />
      </View>

      {error ? (
        <EmptyState title={t('common.error')} actionLabel={t('common.retry')} onAction={refetch} />
      ) : !data?.data?.length ? (
        <EmptyState title={t('elite.no_payments')} />
      ) : (
        <FlatList
          data={data.data}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <PaymentCard item={item} />}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  payBar: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  payHint: { fontSize: 12, color: Colors.textSecondary },
  list: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  amount: { fontSize: 17, fontWeight: '800', color: Colors.primary },
  row: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  col: { flex: 1 },
  colLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', marginBottom: 2 },
  colValue: { fontSize: 14, fontWeight: '700', color: Colors.text },
  date: { fontSize: 11, color: Colors.textMuted },
});
