import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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
import { useAuthStore } from '@/stores/auth.store';
import type { AuthUser } from '@/types/user';

const schema = z.object({
  code: z.string().length(6, 'Code must be 6 characters'),
});

type FormData = z.infer<typeof schema>;

const RESEND_SECONDS = 60;

export default function VerifyScreen() {
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { setTokens, setUser } = useAuthStore();
  const [countdown, setCountdown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      authService.verify({ email: email ?? '', code: data.code.toUpperCase() }),
    onSuccess: async (data) => {
      await setTokens(data.access_token, data.refresh_token);
      await setUser(data.user as AuthUser);
      router.replace('/(tabs)/home');
    },
    onError: (err: unknown) => {
      const apiErr = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error;
      Alert.alert(t('auth.verification_failed'), apiErr?.message ?? t('errors.unknownError'));
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => authService.register({ email: email ?? '', password: '', firstName: '', lastName: '' }),
    onSuccess: () => {
      setCountdown(RESEND_SECONDS);
      Alert.alert(t('auth.code_resent'), t('auth.code_resent_message'));
    },
  });

  return (
    <KeyboardAvoidingContainer>
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth.verificationTitle')}</Text>
        <Text style={styles.subtitle}>
          {t('auth.verificationSubtitle', { email: email ?? '' })}
        </Text>
      </View>

      <Controller
        control={control}
        name="code"
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('auth.verificationCode')}
            placeholder={t('auth.verificationCodePlaceholder')}
            value={value}
            onChangeText={(v) => onChange(v.toUpperCase())}
            autoCapitalize="characters"
            maxLength={6}
            error={errors.code?.message}
          />
        )}
      />

      <Button
        title={t('auth.verify')}
        onPress={handleSubmit((d) => mutation.mutate(d))}
        isLoading={mutation.isPending}
        containerStyle={styles.submitBtn}
      />

      <TouchableOpacity
        onPress={() => resendMutation.mutate()}
        disabled={countdown > 0 || resendMutation.isPending}
        style={styles.resendBtn}
      >
        <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
          {countdown > 0
            ? t('auth.resendIn', { seconds: countdown })
            : t('auth.resendCode')}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 60, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.primaryDark, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textSecondary },
  submitBtn: { marginTop: 16 },
  resendBtn: { alignSelf: 'center', marginTop: 20 },
  resendText: { color: Colors.primary, fontSize: 14, fontWeight: '500' },
  resendDisabled: { color: Colors.textMuted },
});
