import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { KeyboardAvoidingContainer } from '@/components/ui/KeyboardAvoidingContainer';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { Colors } from '@/constants/colors';
import { authService } from '@/services/auth.service';

const schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      router.push({
        pathname: '/(auth)/verify',
        params: { email: getValues('email') },
      });
    },
    onError: (err: unknown) => {
      const apiErr = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error;
      Alert.alert(t('common.error_title'), apiErr?.message ?? t('errors.unknownError'));
    },
  });

  const onSubmit = (data: FormData) => mutation.mutate(data);

  return (
    <KeyboardAvoidingContainer>
      <View style={styles.header}>
        <LanguageToggle />
        <Text style={styles.title}>{t('auth.createAccount')}</Text>
        <Text style={styles.subtitle}>{t('auth.createAccountSubtitle')}</Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="firstName"
          render={({ field: { onChange, value } }) => (
            <Input
              label={t('common.firstName')}
              placeholder={t('auth.firstNamePlaceholder')}
              value={value}
              onChangeText={onChange}
              autoCapitalize="words"
              error={errors.firstName?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="lastName"
          render={({ field: { onChange, value } }) => (
            <Input
              label={t('common.lastName')}
              placeholder={t('auth.lastNamePlaceholder')}
              value={value}
              onChangeText={onChange}
              autoCapitalize="words"
              error={errors.lastName?.message}
            />
          )}
        />
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
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <Input
              label={t('common.password')}
              placeholder={t('auth.passwordPlaceholder')}
              value={value}
              onChangeText={onChange}
              isPassword
              error={errors.password?.message}
            />
          )}
        />

        <Button
          title={t('auth.signUp')}
          onPress={handleSubmit(onSubmit)}
          isLoading={mutation.isPending}
          containerStyle={styles.submitBtn}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('auth.haveAccount')} </Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity>
            <Text style={styles.linkText}>{t('auth.signIn')}</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 48, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.primaryDark, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textSecondary },
  form: { flex: 1 },
  submitBtn: { marginTop: 8 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 32,
    paddingTop: 16,
  },
  footerText: { color: Colors.textSecondary, fontSize: 14 },
  linkText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
