import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Modal, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { applyForElite } from '@/services/elite.service';
import { ELITE_AGREEMENT, ELITE_AGREEMENT_VERSION } from '@/constants/eliteAgreement';

export default function EliteApplyScreen() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'ar' ? 'ar' : 'en';
  const agreement = ELITE_AGREEMENT[lang];
  const [phoneNumber, setPhoneNumber] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [description, setDescription] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      applyForElite({
        phone_number: phoneNumber.trim(),
        investment_amount: Number(investmentAmount.replace(/,/g, '')),
        description: description.trim() || undefined,
        referral_code: referralCode.trim() || undefined,
        agreement_accepted: agreementAccepted,
        agreement_version: ELITE_AGREEMENT_VERSION,
      }),
    onSuccess: () => {
      Alert.alert(
        t('common.success'),
        t('elite.apply_success'),
        [{ text: t('common.ok'), onPress: () => router.replace('/elite/status') }]
      );
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error?.message ??
        err?.response?.data?.message ??
        t('common.error');
      Alert.alert(t('common.error_title'), msg);
    },
  });

  const handleSubmit = () => {
    if (!phoneNumber.trim()) {
      Alert.alert(t('common.error_title'), t('elite.phone_required'));
      return;
    }
    const amount = Number(investmentAmount.replace(/,/g, ''));
    if (!amount || amount <= 0) {
      Alert.alert(t('common.error_title'), t('elite.valid_amount_required'));
      return;
    }
    if (!agreementAccepted) {
      Alert.alert(t('common.error_title'), t('elite.agreement_required_error'));
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
            <Text style={styles.minText}>{t('elite.invest_advisory_note')}</Text>
          </View>
        </View>

        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.info} style={styles.disclaimerIcon} />
          <View style={styles.disclaimerTextWrap}>
            <Text style={styles.disclaimerTitle}>{t('elite.risk_disclaimer_title')}</Text>
            <Text style={styles.disclaimerBody}>{t('elite.risk_disclaimer_body')}</Text>
          </View>
        </View>

        <View style={styles.agreementBox}>
          <Text style={styles.agreementSummary}>{agreement.summary}</Text>
          <Pressable onPress={() => setShowAgreementModal(true)} hitSlop={8}>
            <Text style={styles.agreementLink}>{agreement.readFullLinkLabel}</Text>
          </Pressable>
          <Pressable
            style={styles.agreementCheckboxRow}
            onPress={() => setAgreementAccepted((prev) => !prev)}
            hitSlop={8}
          >
            <View style={[styles.checkbox, agreementAccepted && styles.checkboxChecked]}>
              {agreementAccepted ? <Ionicons name="checkmark" size={14} color={Colors.white} /> : null}
            </View>
            <Text style={styles.agreementCheckboxLabel}>{agreement.checkboxLabel}</Text>
          </Pressable>
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
            label={t('elite.advisory_amount_label')}
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

      <Modal visible={showAgreementModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{agreement.title}</Text>
          <Button title={t('common.cancel')} variant="ghost" onPress={() => setShowAgreementModal(false)} containerStyle={{ height: 38 }} />
        </View>
        <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.agreementSubtitle}>{agreement.subtitle}</Text>
          <Text style={styles.agreementLastUpdated}>{agreement.lastUpdated}</Text>
          <Text style={styles.agreementParagraph}>{agreement.preamble}</Text>
          {agreement.sections.map((section, index) => (
            <View key={index} style={styles.agreementSection}>
              <Text style={styles.agreementHeading}>{section.heading}</Text>
              {section.paragraphs?.map((paragraph, pIndex) => (
                <Text key={pIndex} style={styles.agreementParagraph}>{paragraph}</Text>
              ))}
              {section.list?.map((item, itemIndex) => (
                <Text key={itemIndex} style={styles.agreementListItem}>{'• '}{item}</Text>
              ))}
            </View>
          ))}
        </ScrollView>
      </Modal>
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
  disclaimer: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.infoLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.info + '30',
    padding: 14,
    marginBottom: 28,
  },
  disclaimerIcon: { marginTop: 1 },
  disclaimerTextWrap: { flex: 1 },
  disclaimerTitle: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  disclaimerBody: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  form: { gap: 4 },
  submitBtn: { marginTop: 24 },
  agreementBox: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 28,
    gap: 10,
  },
  agreementSummary: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  agreementLink: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  agreementCheckboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 4 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  agreementCheckboxLabel: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 18 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    paddingTop: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.primary, flex: 1, marginRight: 12 },
  modalBody: { padding: 20 },
  agreementSubtitle: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  agreementLastUpdated: { fontSize: 12, color: Colors.textSecondary, marginBottom: 16 },
  agreementSection: { marginTop: 18 },
  agreementHeading: { fontSize: 15, fontWeight: '700', color: Colors.primary, marginBottom: 6 },
  agreementParagraph: { fontSize: 13, color: Colors.text, lineHeight: 20, marginBottom: 6 },
  agreementListItem: { fontSize: 13, color: Colors.text, lineHeight: 20, marginBottom: 4 },
});
