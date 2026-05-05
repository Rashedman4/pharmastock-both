import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { EliteTabBar } from '@/components/elite/EliteTabBar';
import { Colors } from '@/constants/colors';
import { fetchElitePortfolio, submitCloseRequest, respondToCloseRequest } from '@/services/elite.service';
import type { OpenPosition, PortfolioCloseRequest, Closure } from '@/types/elite';

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

function positionStatusVariant(status: string): BadgeVariant {
  if (status === 'OPEN') return 'success';
  if (status === 'PARTIALLY_CLOSED') return 'warning';
  return 'neutral';
}

function fmt(val: number | null | undefined): string {
  if (val == null) return '—';
  const n = Number(val);
  const prefix = n < 0 ? '-$' : '$';
  return prefix + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface FormState {
  qty: string;
  exitPrice: string;
  note: string;
  image: { uri: string; name: string; type: string } | null;
}

// 'none' | 'request' | 'force'
type ExpandMode = 'none' | 'request' | 'force';

function PositionCard({
  position,
  expandMode,
  onOpenRequest,
  onOpenForce,
  onClose,
  formState,
  setFormState,
  onSubmitRequest,
  onSubmitForce,
  isSubmitting,
}: {
  position: OpenPosition;
  expandMode: ExpandMode;
  onOpenRequest: () => void;
  onOpenForce: () => void;
  onClose: () => void;
  formState: FormState;
  setFormState: (s: FormState) => void;
  onSubmitRequest: () => void;
  onSubmitForce: () => void;
  isSubmitting: boolean;
}) {
  const profitColor = position.unrealizedProfit >= 0 ? Colors.success : Colors.danger;
  const isForce = expandMode === 'force';

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop() ?? 'jpg';
      setFormState({
        ...formState,
        image: {
          uri: asset.uri,
          name: `evidence-${Date.now()}.${ext}`,
          type: asset.mimeType ?? `image/${ext}`,
        },
      });
    }
  };

  return (
    <Card style={styles.positionCard}>
      {/* Header row */}
      <View style={styles.posRow}>
        <View>
          <Text style={styles.posSymbol}>{position.symbol}</Text>
          <Text style={styles.posDetail}>
            Qty: {position.quantityOpen.toLocaleString()} · Entry: {fmt(position.entryPrice)}
          </Text>
        </View>
        <View style={styles.posRight}>
          <Badge label={position.status} variant={positionStatusVariant(position.status)} />
          <Text style={[styles.posProfit, { color: profitColor }]}>{fmt(position.unrealizedProfit)}</Text>
        </View>
      </View>

      {/* Metrics */}
      <View style={styles.posMetrics}>
        <View style={styles.posMetric}>
          <Text style={styles.metricLabel}>Invested</Text>
          <Text style={styles.metricValue}>{fmt(position.investedAmount)}</Text>
        </View>
        <View style={styles.posMetric}>
          <Text style={styles.metricLabel}>Market Value</Text>
          <Text style={styles.metricValue}>{fmt(position.marketValue)}</Text>
        </View>
        <View style={styles.posMetric}>
          <Text style={styles.metricLabel}>Current</Text>
          <Text style={styles.metricValue}>{fmt(position.currentPrice)}</Text>
        </View>
      </View>

      {/* Action buttons */}
      {expandMode === 'none' ? (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.requestBtn]}
            onPress={onOpenRequest}
            activeOpacity={0.7}
          >
            <Text style={styles.requestBtnText}>Request Close</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.forceBtn]}
            onPress={onOpenForce}
            activeOpacity={0.7}
          >
            <Ionicons name="flash" size={14} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.forceBtnText}>Force Close</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.cancelFormBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.cancelFormText}>Cancel</Text>
        </TouchableOpacity>
      )}

      {/* Expanded form */}
      {expandMode !== 'none' && (
        <View style={[styles.closeForm, isForce && styles.forceForm]}>
          {isForce && (
            <View style={styles.forceWarning}>
              <Ionicons name="flash" size={14} color="#92400E" />
              <Text style={styles.forceWarningText}>
                Force close confirms you have already closed this position. Evidence is required.
              </Text>
            </View>
          )}

          <Input
            label={`Close Quantity (max ${position.quantityOpen})`}
            value={formState.qty}
            onChangeText={(v) => setFormState({ ...formState, qty: v })}
            placeholder="0"
            keyboardType="numeric"
          />
          <Input
            label="Exit Price (optional)"
            value={formState.exitPrice}
            onChangeText={(v) => setFormState({ ...formState, exitPrice: v })}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
          <Input
            label="Note (optional)"
            value={formState.note}
            onChangeText={(v) => setFormState({ ...formState, note: v })}
            placeholder={isForce ? 'Reason for force close...' : 'Reason for closing...'}
            multiline
            numberOfLines={2}
          />

          {/* Evidence picker */}
          <Text style={styles.evidenceLabel}>
            Evidence {isForce ? '(required)' : '(optional)'}
            {isForce && <Text style={{ color: Colors.danger }}> *</Text>}
          </Text>
          <TouchableOpacity style={[styles.evidencePicker, isForce && !formState.image && styles.evidenceRequired]} onPress={pickImage} activeOpacity={0.7}>
            {formState.image ? (
              <Image source={{ uri: formState.image.uri }} style={styles.evidencePreview} resizeMode="contain" />
            ) : (
              <View style={styles.evidencePlaceholderBox}>
                <Ionicons name="camera-outline" size={24} color={Colors.textMuted} />
                <Text style={styles.evidencePlaceholder}>
                  {isForce ? 'Tap to attach closing proof *' : 'Tap to attach closing screenshot'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <Button
            title={isForce ? 'Submit Force Close' : 'Submit Close Request'}
            variant={isForce ? 'danger' : 'primary'}
            onPress={isForce ? onSubmitForce : onSubmitRequest}
            isLoading={isSubmitting}
            containerStyle={styles.submitCloseBtn}
          />
        </View>
      )}
    </Card>
  );
}

interface CrFormState {
  note: string;
  image: { uri: string; name: string; type: string } | null;
}

function CloseRequestCard({
  item,
  expanded,
  crForm,
  setCrForm,
  onExpand,
  onCollapse,
  onExecute,
  onReject,
  isSubmitting,
}: {
  item: PortfolioCloseRequest;
  expanded: boolean;
  crForm: CrFormState;
  setCrForm: (s: CrFormState) => void;
  onExpand: () => void;
  onCollapse: () => void;
  onExecute: () => void;
  onReject: () => void;
  isSubmitting: boolean;
}) {
  const isAdminPending = item.initiatedByRole === 'ADMIN' && item.status === 'PENDING';

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop() ?? 'jpg';
      setCrForm({
        ...crForm,
        image: {
          uri: asset.uri,
          name: `cr-evidence-${Date.now()}.${ext}`,
          type: asset.mimeType ?? `image/${ext}`,
        },
      });
    }
  };

  return (
    <Card style={[styles.crCard, isAdminPending && styles.crAdminPending]}>
      <View style={styles.crHeader}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[styles.crFrom, isAdminPending && { color: Colors.danger }]}>
            {item.initiatedByRole === 'ADMIN' ? '⚡ Admin Requests Close' : '✅ Submitted by You'}
          </Text>
          <Text style={styles.crDetail}>
            Qty: {Number(item.requestedQuantity).toLocaleString()}
            {item.requestedExitPrice != null
              ? ` · Exit: $${Number(item.requestedExitPrice).toFixed(4)}`
              : ' · At market price'}
          </Text>
          {item.requestNote ? (
            <Text style={styles.crNote}>{item.requestNote}</Text>
          ) : null}
          <Text style={styles.crDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          {item.responseNote ? (
            <Text style={styles.crResponseNote}>Admin: {item.responseNote}</Text>
          ) : null}
        </View>
        <Badge label={item.status} variant={crStatusVariant(item.status)} />
      </View>

      {/* Execute button for admin-initiated pending requests */}
      {isAdminPending && !expanded && (
        <TouchableOpacity style={styles.executeBtn} onPress={onExpand} activeOpacity={0.7}>
          <Ionicons name="checkmark-circle-outline" size={15} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.executeBtnText}>Execute Close</Text>
        </TouchableOpacity>
      )}

      {/* Inline execute form */}
      {isAdminPending && expanded && (
        <View style={styles.crForm}>
          <TouchableOpacity style={styles.crCollapseBtn} onPress={onCollapse} activeOpacity={0.7}>
            <Text style={styles.crCollapseText}>Cancel</Text>
          </TouchableOpacity>

          <View style={styles.crFormInfo}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.crFormInfoText}>
              Confirm you have closed {Number(item.requestedQuantity).toLocaleString()} shares
              {item.requestedExitPrice != null
                ? ` at $${Number(item.requestedExitPrice).toFixed(4)}`
                : ' at market price'}.
            </Text>
          </View>

          <Input
            label="Response Note (optional)"
            value={crForm.note}
            onChangeText={(v) => setCrForm({ ...crForm, note: v })}
            placeholder="Any notes about the execution..."
            multiline
            numberOfLines={2}
          />

          <Text style={styles.evidenceLabel}>Evidence (optional)</Text>
          <TouchableOpacity style={styles.evidencePicker} onPress={pickImage} activeOpacity={0.7}>
            {crForm.image ? (
              <Image source={{ uri: crForm.image.uri }} style={styles.evidencePreview} resizeMode="contain" />
            ) : (
              <View style={styles.evidencePlaceholderBox}>
                <Ionicons name="camera-outline" size={24} color={Colors.textMuted} />
                <Text style={styles.evidencePlaceholder}>Tap to attach closing screenshot</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.crActionRow}>
            <Button
              title="Execute Close"
              variant="primary"
              onPress={onExecute}
              isLoading={isSubmitting}
              containerStyle={styles.crActionBtn}
            />
            <Button
              title="Reject"
              variant="outline"
              onPress={onReject}
              isLoading={isSubmitting}
              containerStyle={styles.crActionBtn}
              textStyle={{ color: Colors.danger }}
            />
          </View>
        </View>
      )}
    </Card>
  );
}

function ClosureCard({ item }: { item: Closure }) {
  const net = item.realizedProfitAmount - item.firmShareAmount - item.partnerShareAmount;
  const netColor = net >= 0 ? Colors.success : Colors.danger;
  return (
    <Card style={styles.closureCard}>
      <View style={styles.closureRow}>
        <Text style={styles.closureSymbol}>{item.symbol}</Text>
        <View style={styles.closureNetBox}>
          <Text style={styles.closureNetLabel}>Your Net</Text>
          <Text style={[styles.closureNet, { color: netColor }]}>{fmt(net)}</Text>
        </View>
      </View>
      <View style={styles.closureMetrics}>
        <View style={styles.closureMetric}>
          <Text style={styles.metricLabel}>Qty Closed</Text>
          <Text style={styles.metricValue}>{Number(item.closedQuantity).toLocaleString()}</Text>
        </View>
        <View style={styles.closureMetric}>
          <Text style={styles.metricLabel}>Exit Price</Text>
          <Text style={styles.metricValue}>{fmt(item.exitPrice)}</Text>
        </View>
        <View style={styles.closureMetric}>
          <Text style={styles.metricLabel}>Realized</Text>
          <Text style={[styles.metricValue, { color: item.realizedProfitAmount >= 0 ? Colors.success : Colors.danger }]}>
            {fmt(item.realizedProfitAmount)}
          </Text>
        </View>
        <View style={styles.closureMetric}>
          <Text style={styles.metricLabel}>Firm Share</Text>
          <Text style={styles.metricValue}>{fmt(item.firmShareAmount)}</Text>
        </View>
      </View>
      <Text style={styles.closureDate}>{new Date(item.closedAt).toLocaleDateString()}</Text>
    </Card>
  );
}

export default function PortfolioScreen() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandMode, setExpandMode] = useState<Record<number, ExpandMode>>({});
  const [forms, setForms] = useState<Record<number, FormState>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Close-request execute form state
  const [crExpandedId, setCrExpandedId] = useState<number | null>(null);
  const [crForms, setCrForms] = useState<Record<number, CrFormState>>({});
  const [crSubmittingId, setCrSubmittingId] = useState<number | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['elite-portfolio'],
    queryFn: fetchElitePortfolio,
    staleTime: 30_000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const getForm = (id: number): FormState =>
    forms[id] ?? { qty: '', exitPrice: '', note: '', image: null };

  const setForm = (id: number, s: FormState) =>
    setForms((prev) => ({ ...prev, [id]: s }));

  const openForm = (posId: number, mode: 'request' | 'force') => {
    setExpandedId(posId);
    setExpandMode((prev) => ({ ...prev, [posId]: mode }));
  };

  const closeForm = (posId: number) => {
    setExpandedId(null);
    setExpandMode((prev) => ({ ...prev, [posId]: 'none' }));
    setForms((prev) => {
      const next = { ...prev };
      delete next[posId];
      return next;
    });
  };

  const getCrForm = (id: number): CrFormState =>
    crForms[id] ?? { note: '', image: null };

  const setCrForm = (id: number, s: CrFormState) =>
    setCrForms((prev) => ({ ...prev, [id]: s }));

  const handleCrRespond = async (item: PortfolioCloseRequest, decision: 'ACCEPTED' | 'REJECTED') => {
    const form = getCrForm(item.id);
    setCrSubmittingId(item.id);
    try {
      await respondToCloseRequest(
        item.id,
        decision,
        form.note.trim() || null,
        form.image ?? null,
      );
      setCrExpandedId(null);
      setCrForms((prev) => { const n = { ...prev }; delete n[item.id]; return n; });
      qc.invalidateQueries({ queryKey: ['elite-portfolio'] });
      Alert.alert(
        'Success',
        decision === 'ACCEPTED'
          ? 'Close executed successfully.'
          : 'Close request rejected.',
      );
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message ?? t('common.error');
      Alert.alert('Error', msg);
    } finally {
      setCrSubmittingId(null);
    }
  };

  const handleSubmit = async (position: OpenPosition, isForce: boolean) => {
    const form = getForm(position.id);
    const qty = Number(form.qty);

    if (!form.qty || qty <= 0) {
      Alert.alert('Error', 'Please enter a quantity greater than 0');
      return;
    }
    if (qty > position.quantityOpen) {
      Alert.alert('Error', `Quantity cannot exceed ${position.quantityOpen}`);
      return;
    }
    if (isForce && !form.image) {
      Alert.alert('Evidence Required', 'Force close requires an evidence screenshot.');
      return;
    }

    setSubmittingId(position.id);
    try {
      const note = isForce
        ? `[FORCE CLOSE]${form.note ? ' ' + form.note : ''}`
        : form.note.trim() || undefined;

      await submitCloseRequest({
        position_id: position.id,
        requested_quantity: qty,
        requested_exit_price: form.exitPrice ? Number(form.exitPrice) : undefined,
        request_note: note,
        evidence: form.image ?? undefined,
        force_close: isForce,
      });

      closeForm(position.id);
      qc.invalidateQueries({ queryKey: ['elite-portfolio'] });
      Alert.alert(
        'Success',
        isForce
          ? 'Force close submitted. Admin will process your closure.'
          : 'Close request submitted successfully.'
      );
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? t('common.error');
      Alert.alert('Error', msg);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Reload header */}
      <View style={styles.reloadBar}>
        <Text style={styles.reloadTitle}>Portfolio</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.reloadBtn} activeOpacity={0.7}>
          <Ionicons name="refresh-outline" size={20} color={Colors.primary} />
          <Text style={styles.reloadText}>Reload</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={Colors.primary} />
      ) : error ? (
        <EmptyState
          title={t('common.error')}
          actionLabel={t('common.retry')}
          onAction={refetch}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
        >
          {/* Summary */}
          {data?.summary && (
            <View style={styles.summaryRow}>
              <Card style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Free Capital</Text>
                <Text style={styles.summaryValue}>{fmt(data.summary.freeCapitalAmount)}</Text>
              </Card>
              <Card style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>In Market</Text>
                <Text style={styles.summaryValue}>{fmt(data.summary.moneyInMarket)}</Text>
              </Card>
              <Card style={[styles.summaryCard, styles.summaryCardFull]}>
                <Text style={styles.summaryLabel}>Overall Profit</Text>
                <Text style={[
                  styles.summaryValue,
                  { color: Number(data.summary.overallProfit) >= 0 ? Colors.success : Colors.danger },
                ]}>
                  {fmt(data.summary.overallProfit)}
                </Text>
              </Card>
            </View>
          )}

          {/* Open Positions */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Open Positions</Text>
            {data?.openPositions?.length ? (
              <Text style={styles.sectionCount}>{data.openPositions.length}</Text>
            ) : null}
          </View>

          {!data?.openPositions?.length ? (
            <EmptyState title="No open positions yet" />
          ) : (
            data.openPositions.map((pos) => {
              const mode = expandMode[pos.id] ?? 'none';
              return (
                <PositionCard
                  key={pos.id}
                  position={pos}
                  expandMode={mode}
                  onOpenRequest={() => openForm(pos.id, 'request')}
                  onOpenForce={() => openForm(pos.id, 'force')}
                  onClose={() => closeForm(pos.id)}
                  formState={getForm(pos.id)}
                  setFormState={(s) => setForm(pos.id, s)}
                  onSubmitRequest={() => handleSubmit(pos, false)}
                  onSubmitForce={() => handleSubmit(pos, true)}
                  isSubmitting={submittingId === pos.id}
                />
              );
            })
          )}

          {/* Close Requests */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Close Requests</Text>
            {data?.closeRequests?.length ? (
              <Text style={styles.sectionCount}>{data.closeRequests.length}</Text>
            ) : null}
          </View>

          {!data?.closeRequests?.length ? (
            <EmptyState title="No close requests yet" />
          ) : (
            data.closeRequests.map((cr) => (
              <CloseRequestCard
                key={cr.id}
                item={cr}
                expanded={crExpandedId === cr.id}
                crForm={getCrForm(cr.id)}
                setCrForm={(s) => setCrForm(cr.id, s)}
                onExpand={() => setCrExpandedId(cr.id)}
                onCollapse={() => { setCrExpandedId(null); setCrForms((prev) => { const n = { ...prev }; delete n[cr.id]; return n; }); }}
                onExecute={() => handleCrRespond(cr, 'ACCEPTED')}
                onReject={() => handleCrRespond(cr, 'REJECTED')}
                isSubmitting={crSubmittingId === cr.id}
              />
            ))
          )}

          {/* Closure History */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Closure History</Text>
            {data?.closures?.length ? (
              <Text style={styles.sectionCount}>{data.closures.length}</Text>
            ) : null}
          </View>

          {!data?.closures?.length ? (
            <EmptyState title="No closure history yet" />
          ) : (
            data.closures.map((c) => (
              <ClosureCard key={c.id} item={c} />
            ))
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
      <EliteTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  reloadBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: '#fff',
  },
  reloadTitle: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  reloadBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  reloadText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  content: { padding: 16, paddingBottom: 24 },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  summaryCard: { width: '47%', paddingVertical: 12, marginBottom: 0 },
  summaryCardFull: { width: '100%' },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  sectionCount: {
    backgroundColor: Colors.primary,
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  positionCard: { marginBottom: 12 },
  posRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  posSymbol: { fontSize: 17, fontWeight: '800', color: Colors.primary },
  posDetail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  posRight: { alignItems: 'flex-end', gap: 4 },
  posProfit: { fontSize: 13, fontWeight: '700' },
  posMetrics: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 12 },
  posMetric: { flex: 1 },
  metricLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  metricValue: { fontSize: 12, fontWeight: '700', color: Colors.text },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  requestBtn: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  requestBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  forceBtn: { backgroundColor: Colors.danger },
  forceBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  cancelFormBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  cancelFormText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  closeForm: { marginTop: 14 },
  forceForm: {
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    backgroundColor: '#FFF5F5',
  },
  forceWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  forceWarningText: { fontSize: 12, color: '#92400E', flex: 1, lineHeight: 18 },
  evidenceLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6, marginTop: 4 },
  evidencePicker: {
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
    borderRadius: 10,
    minHeight: 80,
    marginBottom: 12,
    overflow: 'hidden',
  },
  evidenceRequired: { borderColor: Colors.danger },
  evidencePlaceholderBox: {
    flex: 1,
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    padding: 12,
  },
  evidencePlaceholder: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  evidencePreview: { width: '100%', height: 120 },
  submitCloseBtn: { marginTop: 4 },
  crCard: { marginBottom: 10 },
  crAdminPending: { borderColor: Colors.danger, borderWidth: 1 },
  crHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  crFrom: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 2 },
  crDetail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  crNote: { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', marginTop: 4 },
  crDate: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  crResponseNote: { fontSize: 12, color: Colors.textSecondary, marginTop: 6, fontStyle: 'italic' },
  executeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 10,
  },
  executeBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  crForm: { marginTop: 12 },
  crCollapseBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  crCollapseText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  crFormInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  crFormInfoText: { fontSize: 12, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
  crActionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  crActionBtn: { flex: 1, height: 44 },
  closureCard: { marginBottom: 10 },
  closureRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  closureSymbol: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  closureNetBox: { alignItems: 'flex-end' },
  closureNetLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  closureNet: { fontSize: 15, fontWeight: '700' },
  closureMetrics: { flexDirection: 'row', gap: 8 },
  closureMetric: { flex: 1 },
  closureDate: { fontSize: 11, color: Colors.textMuted, marginTop: 8 },
});
