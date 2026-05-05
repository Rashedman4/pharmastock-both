import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator,
  TouchableOpacity, Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { fetchTradePlan, respondToTradePlan, submitExecution } from '@/services/elite.service';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary';

function sideVariant(side: string): BadgeVariant {
  return side === 'LONG' ? 'success' : 'danger';
}

function statusVariant(status: string): BadgeVariant {
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

function PriceRow({ label, value, color }: { label: string; value: string | null; color?: string }) {
  if (!value) return null;
  return (
    <View style={styles.priceRow}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={[styles.priceValue, color ? { color } : {}]}>${Number(value).toFixed(4)}</Text>
    </View>
  );
}

export default function TradePlanDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const [note, setNote] = useState('');

  // Execution form state
  const [execQty, setExecQty] = useState('');
  const [execPrice, setExecPrice] = useState('');
  const [execNote, setExecNote] = useState('');
  const [execScreenshot, setExecScreenshot] = useState<{ uri: string; name: string; type: string } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['elite-trade-plan', id],
    queryFn: () => fetchTradePlan(Number(id)),
  });

  const respondMutation = useMutation({
    mutationFn: (decision: 'ACCEPTED' | 'REJECTED') =>
      respondToTradePlan(Number(id), decision, note.trim() || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['elite-trade-plan', id] });
      qc.invalidateQueries({ queryKey: ['elite-trade-plans'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? t('common.error');
      Alert.alert('Error', msg);
    },
  });

  const executeMutation = useMutation({
    mutationFn: () =>
      submitExecution(
        Number(id),
        Number(execQty),
        Number(execPrice),
        execNote.trim() || undefined,
        execScreenshot,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['elite-trade-plan', id] });
      qc.invalidateQueries({ queryKey: ['elite-trade-plans'] });
      qc.invalidateQueries({ queryKey: ['elite-portfolio'] });
      Alert.alert('Success', 'Execution submitted successfully.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? t('common.error');
      Alert.alert('Error', msg);
    },
  });

  const handleRespond = (decision: 'ACCEPTED' | 'REJECTED') => {
    Alert.alert(
      decision === 'ACCEPTED' ? t('elite.accept') : t('elite.reject'),
      `Are you sure you want to ${decision.toLowerCase()} this trade plan?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.confirm'), onPress: () => respondMutation.mutate(decision) },
      ]
    );
  };

  const handleExecute = () => {
    if (!execQty || Number(execQty) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }
    if (!execPrice || Number(execPrice) <= 0) {
      Alert.alert('Error', 'Please enter a valid entry price');
      return;
    }
    Alert.alert(
      'Submit Execution',
      `Submit execution of ${execQty} shares at $${Number(execPrice).toFixed(4)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: () => executeMutation.mutate() },
      ]
    );
  };

  const pickScreenshot = async () => {
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
      setExecScreenshot({
        uri: asset.uri,
        name: `execution-${Date.now()}.${ext}`,
        type: asset.mimeType ?? `image/${ext}`,
      });
    }
  };

  if (isLoading) return <ActivityIndicator style={{ marginTop: 60 }} color={Colors.primary} />;
  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('common.error')}</Text>
      </View>
    );
  }

  const canRespond = data.investor_decision === 'PENDING' &&
    (data.status === 'SENT' || data.status === 'DRAFT');

  const canExecute = data.status === 'ACCEPTED_BY_INVESTOR' && !data.execution_id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.symbol}>{data.symbol}</Text>
          {data.company_name ? <Text style={styles.company}>{data.company_name}</Text> : null}
        </View>
        <View style={styles.badges}>
          <Badge
            label={data.plan_side === 'LONG' ? t('elite.long') : t('elite.short')}
            variant={sideVariant(data.plan_side)}
          />
          <Badge label={data.status.replace(/_/g, ' ')} variant={statusVariant(data.status)} />
        </View>
      </View>

      {/* Plan Details */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>{t('elite.plan_detail')}</Text>
        <PriceRow label={t('elite.reference_price')} value={data.reference_market_price} />
        <PriceRow label={t('elite.entry')} value={data.target_entry_price} />
        <PriceRow label={t('elite.target_1')} value={data.target_price_1} color={Colors.success} />
        <PriceRow label={t('elite.target_2')} value={data.target_price_2} color={Colors.success} />
        <PriceRow label={t('elite.stop_loss')} value={data.stop_loss_price} color={Colors.danger} />
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>{t('elite.quantity')}</Text>
          <Text style={styles.priceValue}>{Number(data.suggested_quantity).toLocaleString()}</Text>
        </View>
        {data.admin_note && (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>Admin Note</Text>
            <Text style={styles.noteText}>{data.admin_note}</Text>
          </View>
        )}
      </Card>

      {/* Investor Respond */}
      {canRespond && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('elite.respond_plan')}</Text>
          <Input
            label={t('elite.your_note')}
            value={note}
            onChangeText={setNote}
            placeholder={t('elite.note_placeholder')}
            multiline
            numberOfLines={3}
          />
          <View style={styles.respondBtns}>
            <Button
              title={t('elite.accept')}
              variant="primary"
              onPress={() => handleRespond('ACCEPTED')}
              isLoading={respondMutation.isPending}
              containerStyle={styles.respondBtn}
            />
            <Button
              title={t('elite.reject')}
              variant="outline"
              onPress={() => handleRespond('REJECTED')}
              isLoading={respondMutation.isPending}
              containerStyle={styles.respondBtn}
              textStyle={{ color: Colors.danger }}
            />
          </View>
        </Card>
      )}

      {/* Execution Form — shown when accepted and no execution yet */}
      {canExecute && (
        <Card style={[styles.section, styles.execSection]}>
          <Text style={styles.sectionTitle}>Submit Execution</Text>
          <Text style={styles.execHint}>
            Enter the actual quantity and price at which you executed this trade.
          </Text>
          <Input
            label="Actual Quantity"
            value={execQty}
            onChangeText={setExecQty}
            placeholder={`Suggested: ${Number(data.suggested_quantity).toLocaleString()}`}
            keyboardType="numeric"
          />
          <Input
            label="Actual Entry Price"
            value={execPrice}
            onChangeText={setExecPrice}
            placeholder={data.target_entry_price
              ? `Target: $${Number(data.target_entry_price).toFixed(4)}`
              : '0.0000'}
            keyboardType="decimal-pad"
          />
          <Input
            label="Note (optional)"
            value={execNote}
            onChangeText={setExecNote}
            placeholder="Any notes about your execution..."
            multiline
            numberOfLines={2}
          />

          {/* Screenshot picker */}
          <Text style={styles.screenshotLabel}>Execution Screenshot (optional)</Text>
          <TouchableOpacity style={styles.screenshotPicker} onPress={pickScreenshot} activeOpacity={0.7}>
            {execScreenshot ? (
              <Image source={{ uri: execScreenshot.uri }} style={styles.screenshotPreview} resizeMode="contain" />
            ) : (
              <Text style={styles.screenshotPlaceholder}>Tap to attach screenshot</Text>
            )}
          </TouchableOpacity>

          <Button
            title="Submit Execution"
            onPress={handleExecute}
            isLoading={executeMutation.isPending}
            containerStyle={styles.execBtn}
          />
        </Card>
      )}

      {/* Execution summary */}
      {data.execution_id && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Execution</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Executed Price</Text>
            <Text style={styles.priceValue}>${Number(data.executed_price).toFixed(4)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Executed Quantity</Text>
            <Text style={styles.priceValue}>{Number(data.executed_quantity).toLocaleString()}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Executed At</Text>
            <Text style={styles.priceValue}>
              {data.executed_at ? new Date(data.executed_at).toLocaleDateString() : '—'}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Status</Text>
            <Badge label={data.execution_status ?? ''} variant="primary" />
          </View>
          {data.screenshot_url && (
            <Text style={styles.screenshotLink}>Screenshot attached</Text>
          )}
        </Card>
      )}

      {/* Open Position */}
      {data.position_id && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Open Position</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Quantity Open</Text>
            <Text style={styles.priceValue}>{Number(data.quantity_open).toLocaleString()}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Entry Price</Text>
            <Text style={styles.priceValue}>${Number(data.entry_price).toFixed(4)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Position Status</Text>
            <Badge label={data.position_status ?? ''} variant="info" />
          </View>
        </Card>
      )}

      {/* Messages link */}
      <Button
        title={t('elite.messages')}
        variant="outline"
        onPress={() => router.push(`/elite/trade-plans/${id}/messages`)}
        containerStyle={{ marginTop: 8 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: Colors.danger, fontSize: 16 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 20,
  },
  symbol: { fontSize: 26, fontWeight: '800', color: Colors.primary },
  company: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  badges: { gap: 6, alignItems: 'flex-end' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginBottom: 12, letterSpacing: 0.3 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  priceLabel: { fontSize: 13, color: Colors.textSecondary },
  priceValue: { fontSize: 14, fontWeight: '700', color: Colors.text },
  noteBox: { marginTop: 12, backgroundColor: Colors.backgroundSecondary, borderRadius: 8, padding: 10 },
  noteLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', marginBottom: 4 },
  noteText: { fontSize: 13, color: Colors.text },
  respondBtns: { flexDirection: 'row', gap: 12, marginTop: 12 },
  respondBtn: { flex: 1 },
  execSection: { borderColor: Colors.success, borderWidth: 1 },
  execHint: { fontSize: 12, color: Colors.textSecondary, marginBottom: 12, fontStyle: 'italic' },
  screenshotLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6, marginTop: 4 },
  screenshotPicker: {
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
    borderRadius: 10,
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  screenshotPlaceholder: { fontSize: 13, color: Colors.textMuted },
  screenshotPreview: { width: '100%', height: 120 },
  execBtn: { marginTop: 4 },
  screenshotLink: { fontSize: 12, color: Colors.primary, marginTop: 8, fontWeight: '600' },
});
