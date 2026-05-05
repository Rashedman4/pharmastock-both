import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { applyForElite } from '@/services/elite.service';

export default function EliteApplyScreen() {
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [description, setDescription] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      applyForElite({
        phone_number: phoneNumber.trim(),
        investment_amount: Number(investmentAmount.replace(/,/g, '')),
        description: description.trim() || undefined,
        referral_code: referralCode.trim() || undefined,
      }),
    onSuccess: () => {
      Alert.alert(
        t('common.confirm'),
        t('elite.apply_success'),
        [{ text: 'OK', onPress: () => router.replace('/elite/status') }]
      );
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error?.message ??
        err?.response?.data?.message ??
        t('common.error');
      Alert.alert('Error', msg);
    },
  });

  const handleSubmit = () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }
    const amount = Number(investmentAmount.replace(/,/g, ''));
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid investment amount');
      return;
    }
    mutation.mutate();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('elite.apply')}</Text>
          <Text style={styles.subtitle}>{t('elite.apply_subtitle')}</Text>
          <View style={styles.minBadge}>
            <Text style={styles.minText}>{t('elite.invest_min')}</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Input
            label={t('elite.phone_number')}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="+1 555 000 0000"
            keyboardType="phone-pad"
            autoComplete="tel"
          />

          <Input
            label={t('elite.investment_amount')}
            value={investmentAmount}
            onChangeText={setInvestmentAmount}
            placeholder="100,000"
            keyboardType="numeric"
          />

          <Input
            label={t('elite.description')}
            value={description}
            onChangeText={setDescription}
            placeholder={t('elite.description_placeholder')}
            multiline
            numberOfLines={4}
          />

          <Input
            label={t('elite.referral_code')}
            value={referralCode}
            onChangeText={setReferralCode}
            placeholder={t('elite.referral_placeholder')}
            autoCapitalize="none"
          />

          <Button
            title={t('elite.apply')}
            onPress={handleSubmit}
            isLoading={mutation.isPending}
            containerStyle={styles.submitBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingBottom: 48 },
  header: { marginBottom: 32 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.primary, marginBottom: 6 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginBottom: 12 },
  minBadge: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  minText: { fontSize: 13, fontWeight: '600', color: Colors.warning },
  form: { gap: 4 },
  submitBtn: { marginTop: 24 },
});
