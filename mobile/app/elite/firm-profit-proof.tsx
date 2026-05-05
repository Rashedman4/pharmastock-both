import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, Image, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { uploadFirmProfitProof, fetchBankAccounts } from '@/services/elite.service';

export default function FirmProfitProofScreen() {
  const { t } = useTranslation();
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  const qc = useQueryClient();
  const [image, setImage] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [transferRef, setTransferRef] = useState('');
  const [note, setNote] = useState('');

  const { data: bankData, isLoading: loadingBanks } = useQuery({
    queryKey: ['elite-bank-accounts'],
    queryFn: fetchBankAccounts,
  });

  const uploadMutation = useMutation({
    mutationFn: () =>
      uploadFirmProfitProof(
        Number(paymentId),
        image!,
        transferRef.trim() || undefined,
        note.trim() || undefined,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['elite-firm-profit-payments'] });
      Alert.alert('Success', 'Proof submitted successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? t('common.error');
      Alert.alert('Error', msg);
    },
  });

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop() ?? 'jpg';
      setImage({
        uri: asset.uri,
        name: `proof-${Date.now()}.${ext}`,
        type: asset.mimeType ?? `image/${ext}`,
      });
    }
  };

  const handleSubmit = () => {
    if (!image) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }
    uploadMutation.mutate();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Bank details */}
      {loadingBanks ? (
        <ActivityIndicator color={Colors.primary} style={{ marginBottom: 20 }} />
      ) : bankData?.data?.length ? (
        <Card style={styles.bankCard}>
          <Text style={styles.sectionTitle}>{t('elite.bank_details')}</Text>
          {bankData.data.map((bank) => (
            <View key={bank.id} style={styles.bankItem}>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>{t('elite.bank_name')}</Text>
                <Text style={styles.bankValue}>{bank.bank_name}</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>{t('elite.account_name')}</Text>
                <Text style={styles.bankValue}>{bank.account_name}</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>{t('elite.iban')}</Text>
                <Text style={styles.bankValue}>{bank.iban}</Text>
              </View>
              {bank.swift_code && (
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>{t('elite.swift')}</Text>
                  <Text style={styles.bankValue}>{bank.swift_code}</Text>
                </View>
              )}
              {bank.instructions && (
                <Text style={styles.instructions}>{bank.instructions}</Text>
              )}
            </View>
          ))}
        </Card>
      ) : null}

      {/* File picker */}
      <Text style={styles.label}>{t('elite.upload_proof')}</Text>

      <TouchableOpacity style={styles.picker} onPress={pickImage} activeOpacity={0.7}>
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.previewImage} resizeMode="contain" />
        ) : (
          <View style={styles.pickerPlaceholder}>
            <Text style={styles.pickerIcon}>📎</Text>
            <Text style={styles.pickerText}>{t('elite.select_image')}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Input
        label={t('elite.transfer_reference')}
        value={transferRef}
        onChangeText={setTransferRef}
        placeholder="e.g. TXN-2024-001"
        autoCapitalize="characters"
      />

      <Input
        label={t('common.save')}
        value={note}
        onChangeText={setNote}
        placeholder={t('elite.note_placeholder')}
        multiline
        numberOfLines={3}
      />

      <Button
        title={t('elite.submit_proof')}
        onPress={handleSubmit}
        isLoading={uploadMutation.isPending}
        containerStyle={styles.submitBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingBottom: 48 },
  bankCard: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginBottom: 12 },
  bankItem: { borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 8, marginTop: 8 },
  bankRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  bankLabel: { fontSize: 12, color: Colors.textMuted },
  bankValue: { fontSize: 13, fontWeight: '600', color: Colors.text, flex: 1, textAlign: 'right' },
  instructions: { fontSize: 12, color: Colors.textSecondary, marginTop: 6, fontStyle: 'italic' },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  picker: {
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
    borderRadius: 12,
    minHeight: 160,
    marginBottom: 20,
    overflow: 'hidden',
  },
  pickerPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, minHeight: 160 },
  pickerIcon: { fontSize: 32, marginBottom: 8 },
  pickerText: { fontSize: 15, color: Colors.textSecondary },
  previewImage: { width: '100%', height: 200 },
  submitBtn: { marginTop: 24 },
});
