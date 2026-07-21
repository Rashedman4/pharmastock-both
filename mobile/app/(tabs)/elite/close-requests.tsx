import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Modal, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { formatDate, formatNumber } from '@/lib/format';
import { fetchCloseRequests, submitCloseRequest } from '@/services/elite.service';
import { closeRequestStatusLabel } from '@/lib/eliteStatus';
import type { CloseRequest } from '@/types/elite';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary';

function crStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    CANCELLED: 'neutral',
    EXECUTED: 'primary',
  };
  return map[status] ?? 'neutral';
}

function CloseRequestCard({ item }: { item: CloseRequest }) {
  const { t } = useTranslation();
  return (
    <Card>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.symbol}>{item.symbol}</Text>
          {item.company_name && <Text style={styles.company}>{item.company_name}</Text>}
        </View>
        <Badge label={closeRequestStatusLabel(item.status, t)} variant={crStatusVariant(item.status)} />
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.colLabel}>{t('elite.side')}</Text>
          <Text style={styles.colValue}>{item.side}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.colLabel}>{t('elite.requested_qty')}</Text>
          <Text style={styles.colValue}>{formatNumber(item.requested_quantity)}</Text>
        </View>
        {item.requested_exit_price && (
          <View style={styles.col}>
            <Text style={styles.colLabel}>{t('elite.exit_price_label')}</Text>
            <Text style={styles.colValue}>${Number(item.requested_exit_price).toFixed(4)}</Text>
          </View>
        )}
      </View>

      {item.request_note && (
        <Text style={styles.note}>{item.request_note}</Text>
      )}

      <Text style={styles.date}>{formatDate(item.created_at)}</Text>
    </Card>
  );
}

export default function CloseRequestsScreen() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [positionId, setPositionId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [reqNote, setReqNote] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['elite-close-requests'],
    queryFn: () => fetchCloseRequests(1, 50),
    staleTime: 30_000,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      submitCloseRequest({
        position_id: Number(positionId),
        requested_quantity: Number(quantity),
        requested_exit_price: exitPrice ? Number(exitPrice) : undefined,
        request_note: reqNote.trim() || undefined,
      }),
    onSuccess: () => {
      setShowModal(false);
      setPositionId(''); setQuantity(''); setExitPrice(''); setReqNote('');
      qc.invalidateQueries({ queryKey: ['elite-close-requests'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? t('common.error');
      Alert.alert(t('common.error_title'), msg);
    },
  });

  const handleSubmit = () => {
    if (!positionId || !quantity) {
      Alert.alert(t('common.error_title'), t('elite.position_qty_required_error'));
      return;
    }
    submitMutation.mutate();
  };

  if (isLoading) return <ActivityIndicator style={{ marginTop: 60 }} color={Colors.primary} />;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.count}>
          {t('elite.request_count', { count: data?.pagination?.total ?? 0 })}
        </Text>
        <Button
          title={t('elite.new_close_request')}
          onPress={() => setShowModal(true)}
          containerStyle={{ height: 38, paddingHorizontal: 14 }}
        />
      </View>

      {error ? (
        <EmptyState title={t('common.error')} actionLabel={t('common.retry')} onAction={refetch} />
      ) : !data?.data?.length ? (
        <EmptyState title={t('elite.no_close_requests')} />
      ) : (
        <FlatList
          data={data.data}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <CloseRequestCard item={item} />}
          contentContainerStyle={styles.list}
        />
      )}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t('elite.new_close_request')}</Text>
          <Button title={t('common.cancel')} variant="ghost" onPress={() => setShowModal(false)} containerStyle={{ height: 38 }} />
        </View>
        <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
          <Input
            label={t('elite.position_id_label')}
            value={positionId}
            onChangeText={setPositionId}
            placeholder={t('elite.position_id_placeholder')}
            keyboardType="numeric"
          />
          <Input
            label={t('elite.close_quantity')}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="0"
            keyboardType="numeric"
          />
          <Input
            label={t('elite.exit_price')}
            value={exitPrice}
            onChangeText={setExitPrice}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
          <Input
            label={t('elite.request_note')}
            value={reqNote}
            onChangeText={setReqNote}
            placeholder={t('elite.note_placeholder')}
            multiline
            numberOfLines={3}
          />
          <Button
            title={t('elite.submit_request')}
            onPress={handleSubmit}
            isLoading={submitMutation.isPending}
            containerStyle={{ marginTop: 16, marginBottom: 40 }}
          />
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  count: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  list: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  symbol: { fontSize: 17, fontWeight: '800', color: Colors.primary },
  company: { fontSize: 12, color: Colors.textSecondary },
  row: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  col: { flex: 1 },
  colLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', marginBottom: 2 },
  colValue: { fontSize: 14, fontWeight: '700', color: Colors.text },
  note: { fontSize: 12, color: Colors.textSecondary, fontStyle: 'italic', marginBottom: 4 },
  date: { fontSize: 11, color: Colors.textMuted },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    paddingTop: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  modalBody: { padding: 20 },
});
