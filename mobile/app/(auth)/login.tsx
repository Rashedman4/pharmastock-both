import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
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
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const { t } = useTranslation();
  const { setTokens, setUser } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async (data) => {
      await setTokens(data.access_token, data.refresh_token);
      await setUser(data.user as AuthUser);
      router.replace('/(tabs)/home');
    },
    onError: (err: unknown) => {
      const apiErr = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error;
      Alert.alert('Login Failed', apiErr?.message ?? t('errors.unknownError'));
    },
  });

  const onSubmit = (data: FormData) => mutation.mutate(data);

  return (
    <KeyboardAvoidingContainer>
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
        <Text style={styles.subtitle}>{t('auth.signInSubtitle')}</Text>
      </View>

      <View style={styles.form}>
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

        <Link href="/(auth)/forgot-password" asChild>
          <TouchableOpacity style={styles.forgotLink}>
            <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>
        </Link>

        <Button
          title={t('auth.signIn')}
          onPress={handleSubmit(onSubmit)}
          isLoading={mutation.isPending}
          containerStyle={styles.submitBtn}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('auth.noAccount')} </Text>
        <Link href="/(auth)/register" asChild>
          <TouchableOpacity>
            <Text style={styles.linkText}>{t('auth.signUp')}</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 60, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.primaryDark, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textSecondary },
  form: { flex: 1 },
  forgotLink: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { color: Colors.primary, fontSize: 14, fontWeight: '500' },
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
