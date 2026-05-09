import React from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { EliteTabBar } from '@/components/elite/EliteTabBar';
import { Colors } from '@/constants/colors';
import { fetchFirmProfitPayments } from '@/services/elite.service';
import type { FirmProfitPayment } from '@/types/elite';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary';

function paymentStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    PENDING: 'warning',
    AWAITING_TRANSFER: 'info',
    PROOF_SUBMITTED: 'info',
    UNDER_REVIEW: 'warning',
    PAID: 'success',
    REJECTED: 'danger',
    FAILED: 'danger',
    CANCELLED: 'neutral',
    EXPIRED: 'neutral',
    CHECKOUT_CREATED: 'primary',
  };
  return map[status] ?? 'neutral';
}

function PaymentCard({ item }: { item: FirmProfitPayment }) {
  const { t } = useTranslation();
  const canUploadProof = item.status === 'AWAITING_TRANSFER' && item.payment_method === 'BANK_TRANSFER';

  return (
    <Card>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.amount}>${Number(item.amount_requested).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
          <Text style={styles.method}>{item.payment_method.replace(/_/g, ' ')}</Text>
        </View>
        <Badge label={item.status.replace(/_/g, ' ')} variant={paymentStatusVariant(item.status)} />
      </View>

      {item.bank_name && (
        <View style={styles.bankInfo}>
          <Text style={styles.bankLabel}>{t('elite.bank_name')}</Text>
          <Text style={styles.bankValue}>{item.bank_name}</Text>
        </View>
      )}

      {item.iban && (
        <View style={styles.bankInfo}>
          <Text style={styles.bankLabel}>{t('elite.iban')}</Text>
          <Text style={styles.bankValue}>{item.iban}</Text>
        </View>
      )}

      {item.amount_paid && Number(item.amount_paid) > 0 && (
        <View style={styles.bankInfo}>
          <Text style={styles.bankLabel}>{t('elite.amount_paid')}</Text>
          <Text style={[styles.bankValue, { color: Colors.success }]}>
            ${Number(item.amount_paid).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      )}

      <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>

      {canUploadProof && (
        <Button
          title={item.proof_url ? t('elite.proof_uploaded') : t('elite.upload_proof')}
          variant={item.proof_url ? 'outline' : 'primary'}
          onPress={() => router.push({ pathname: '/elite/firm-profit-proof', params: { paymentId: String(item.id) } })}
          containerStyle={styles.uploadBtn}
        />
      )}
    </Card>
  );
}

export default function FirmProfitScreen() {
  const { t } = useTranslation();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['elite-firm-profit-payments'],
    queryFn: () => fetchFirmProfitPayments(1, 50),
    staleTime: 30_000,
  });

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={Colors.primary} />
      ) : error ? (
        <EmptyState
          title={t('common.error')}
          actionLabel={t('common.retry')}
          onAction={refetch}
        />
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
      <EliteTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  amount: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  method: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  bankInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  bankLabel: { fontSize: 12, color: Colors.textMuted },
  bankValue: { fontSize: 12, fontWeight: '600', color: Colors.text },
  date: { fontSize: 11, color: Colors.textMuted, marginTop: 8 },
  uploadBtn: { marginTop: 12, height: 42 },
});
