import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
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

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { token } = useLocalSearchParams<{ token: string }>();

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      authService.resetPassword({ token: token ?? '', password: data.password }),
    onSuccess: () => {
      Alert.alert(
        'Password Reset',
        'Your password has been reset successfully.',
        [{ text: 'Sign In', onPress: () => router.replace('/(auth)/login') }]
      );
    },
    onError: (err: unknown) => {
      const apiErr = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error;
      Alert.alert('Error', apiErr?.message ?? t('errors.unknownError'));
    },
  });

  return (
    <KeyboardAvoidingContainer>
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth.resetPasswordTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.resetPasswordSubtitle')}</Text>
      </View>

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('auth.newPassword')}
            placeholder={t('auth.newPasswordPlaceholder')}
            value={value}
            onChangeText={onChange}
            isPassword
            error={errors.password?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('auth.confirmPassword')}
            placeholder={t('auth.confirmPasswordPlaceholder')}
            value={value}
            onChangeText={onChange}
            isPassword
            error={errors.confirmPassword?.message}
          />
        )}
      />

      <Button
        title={t('auth.resetPassword')}
        onPress={handleSubmit((d) => mutation.mutate(d))}
        isLoading={mutation.isPending}
        containerStyle={styles.submitBtn}
      />
    </KeyboardAvoidingContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 60, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.primaryDark, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textSecondary },
  submitBtn: { marginTop: 16 },
});
