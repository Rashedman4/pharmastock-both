import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { KeyboardAvoidingContainer } from '@/components/ui/KeyboardAvoidingContainer';
import { Colors } from '@/constants/colors';
import { authService } from '@/services/auth.service';

const schema = z.object({
  email: z.string().email('Invalid email'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: () => setSent(true),
    onError: () => setSent(true), // anti-enumeration: always show success
  });

  if (sent) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.sentTitle}>Check Your Email</Text>
        <Text style={styles.sentSubtitle}>
          If an account exists for that email, you will receive a password reset link shortly.
        </Text>
        <Button
          title={t('common.back')}
          variant="outline"
          onPress={() => router.back()}
          containerStyle={styles.backBtn}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingContainer>
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth.forgotPasswordTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.forgotPasswordSubtitle')}</Text>
      </View>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('common.email')}
            placeholder={t('auth.emailPlaceholder')}
            value={value}
            onChangeText={onChange}
            keyboardType="email-address"
            error={errors.email?.message}
          />
        )}
      />

      <Button
        title={t('auth.sendResetLink')}
        onPress={handleSubmit((d) => mutation.mutate(d))}
        isLoading={mutation.isPending}
        containerStyle={styles.submitBtn}
      />

      <Button
        title={t('common.back')}
        variant="ghost"
        onPress={() => router.back()}
        containerStyle={styles.backBtn}
      />
    </KeyboardAvoidingContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 60, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.primaryDark, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textSecondary },
  submitBtn: { marginTop: 16 },
  backBtn: { marginTop: 12 },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.background,
  },
  sentTitle: { fontSize: 24, fontWeight: '700', color: Colors.primaryDark, marginBottom: 12, textAlign: 'center' },
  sentSubtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: 32 },
});
