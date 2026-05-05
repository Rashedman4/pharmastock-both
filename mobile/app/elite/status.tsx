import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Colors } from '@/constants/colors';
import { fetchEliteStatus } from '@/services/elite.service';
type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary';

function statusVariant(status: string | null): BadgeVariant {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'danger';
  return 'warning';
}

export default function EliteStatusScreen() {
  const { t } = useTranslation();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['elite-status'],
    queryFn: fetchEliteStatus,
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

  const appStatus = data.application_status;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('elite.status')}</Text>

      <Card style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>{t('elite.status')}</Text>
          {appStatus ? (
            <Badge
              label={t(`elite.${appStatus.toLowerCase()}`)}
              variant={statusVariant(appStatus)}
            />
          ) : (
            <Badge label={t('elite.pending')} variant="neutral" />
          )}
        </View>

        {data.application_date && (
          <View style={styles.row}>
            <Text style={styles.label}>Applied</Text>
            <Text style={styles.value}>
              {new Date(data.application_date).toLocaleDateString()}
            </Text>
          </View>
        )}

        {data.admin_response && (
          <View style={styles.responseBox}>
            <Text style={styles.responseLabel}>{t('elite.admin_response')}</Text>
            <Text style={styles.responseText}>{data.admin_response}</Text>
          </View>
        )}
      </Card>

      {appStatus === 'PENDING' && (
        <Card style={styles.infoCard}>
          <Text style={styles.infoText}>{t('elite.application_under_review')}</Text>
        </Card>
      )}

      {appStatus === 'REJECTED' && (
        <Card style={styles.rejectedCard}>
          <Text style={styles.rejectedText}>{t('elite.application_rejected_body')}</Text>
        </Card>
      )}

      {(appStatus === 'APPROVED' || data.is_elite_member) && (
        <Button
          title={t('elite.go_to_dashboard')}
          onPress={() => router.replace('/elite/dashboard')}
          containerStyle={styles.actionBtn}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.primary, marginBottom: 20 },
  card: { marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  value: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  responseBox: {
    marginTop: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
  },
  responseLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', marginBottom: 4 },
  responseText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  infoCard: { backgroundColor: Colors.infoLight, borderColor: Colors.info },
  infoText: { color: Colors.info, fontSize: 14, fontWeight: '500' },
  rejectedCard: { backgroundColor: Colors.dangerLight, borderColor: Colors.danger },
  rejectedText: { color: Colors.danger, fontSize: 14 },
  actionBtn: { marginTop: 8 },
  errorText: { fontSize: 16, color: Colors.danger },
});
