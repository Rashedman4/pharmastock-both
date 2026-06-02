import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { KeyboardAvoidingContainer } from '@/components/ui/KeyboardAvoidingContainer';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { Colors } from '@/constants/colors';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { signInWithGoogle, configureGoogleSignIn } from '@/lib/googleSignIn';
import type { AuthUser } from '@/types/user';

configureGoogleSignIn();

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const { t } = useTranslation();
  const { setTokens, setUser } = useAuthStore();
  const [googleLoading, setGoogleLoading] = useState(false);

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
      Alert.alert(t('common.error_title'), apiErr?.message ?? t('errors.unknownError'));
    },
  });

  const onSubmit = (data: FormData) => mutation.mutate(data);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { idToken } = await signInWithGoogle();
      const data = await authService.googleLogin({ idToken });
      await setTokens(data.access_token, data.refresh_token);
      await setUser(data.user as AuthUser);
      router.replace('/(tabs)/home');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      console.log('[Google] error code:', code, 'full:', JSON.stringify(err));
      if (code === 'SIGN_IN_CANCELLED' || code === '12501') return; // user cancelled
      const apiErr = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error;
      Alert.alert(
        t('common.error_title'),
        apiErr?.message ?? `${t('errors.unknownError')} (code: ${code ?? 'none'})`,
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingContainer>
      <View style={styles.header}>
        <LanguageToggle />
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

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('auth.orContinueWith')}</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.googleBtn}
          onPress={handleGoogleSignIn}
          disabled={googleLoading || mutation.isPending}
          activeOpacity={0.8}
        >
          {googleLoading ? (
            <ActivityIndicator color={Colors.textPrimary} size="small" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <Text style={styles.googleBtnText}>{t('auth.continueWithGoogle')}</Text>
            </>
          )}
        </TouchableOpacity>
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
  header: { marginTop: 48, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.primaryDark, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textSecondary },
  form: { flex: 1 },
  forgotLink: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { color: Colors.primary, fontSize: 14, fontWeight: '500' },
  submitBtn: { marginTop: 8 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  dividerText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingVertical: 13,
    backgroundColor: Colors.white,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
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
