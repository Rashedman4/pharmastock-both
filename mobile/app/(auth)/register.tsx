import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform, Modal, FlatList, TextInput } from 'react-native';
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
import { signInWithGoogle } from '@/lib/googleSignIn';
import { signInWithApple, isAppleAuthAvailable } from '@/lib/appleSignIn';
import * as AppleAuthentication from 'expo-apple-authentication';
import type { AuthUser } from '@/types/user';

// Kept in sync with the `countryCodes` list in
// pharma-stock/src/components/auth/{en,ar}/RegisterComp.tsx so both apps offer identical choices.
const COUNTRY_CODES = [
  { name: 'الأردن', code: '+962' },
  { name: 'الإمارات العربية المتحدة', code: '+971' },
  { name: 'البحرين', code: '+973' },
  { name: 'السعودية', code: '+966' },
  { name: 'العراق', code: '+964' },
  { name: 'الكويت', code: '+965' },
  { name: 'لبنان', code: '+961' },
  { name: 'مصر', code: '+20' },
  { name: 'عمان', code: '+968' },
  { name: 'قطر', code: '+974' },
  { name: 'United States', code: '+1' },
  { name: 'United Kingdom', code: '+44' },
  { name: 'Australia', code: '+61' },
  { name: 'Germany', code: '+49' },
  { name: 'France', code: '+33' },
  { name: 'India', code: '+91' },
];

const schema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email'),
    countryCode: z.string().optional(),
    phoneNumber: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .refine((data) => !data.phoneNumber?.trim() || !!data.countryCode, {
    message: 'Please select a country code',
    path: ['countryCode'],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { setTokens, setUser } = useAuthStore();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      isAppleAuthAvailable().then(setAppleAvailable);
    }
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue,
    watch,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const selectedCountryCode = watch('countryCode');

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

  const onSubmit = (data: FormData) => {
    const trimmedPhone = data.phoneNumber?.trim();
    mutation.mutate({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      phoneNumber: trimmedPhone ? `${data.countryCode}${trimmedPhone}` : undefined,
    });
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      const credential = await signInWithApple();
      if (!credential.identityToken) throw new Error('No identity token');
      const data = await authService.appleLogin({
        identityToken: credential.identityToken,
        fullName: credential.fullName
          ? { firstName: credential.fullName.givenName, lastName: credential.fullName.familyName }
          : null,
      });
      await setTokens(data.access_token, data.refresh_token);
      await setUser(data.user as AuthUser);
      router.replace('/(tabs)/home');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert(t('common.error_title'), t('errors.unknownError'));
    } finally {
      setAppleLoading(false);
    }
  };

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
      if (code === 'SIGN_IN_CANCELLED' || code === '12501') return;
      const apiErr = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error;
      Alert.alert(t('common.error_title'), apiErr?.message ?? t('errors.unknownError'));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingContainer>
      <View style={styles.header}>
        <LanguageToggle />
        <Text style={styles.title}>{t('auth.createAccount')}</Text>
        <Text style={styles.subtitle}>{t('auth.createAccountSubtitle')}</Text>
      </View>

      <View style={styles.form}>
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

        {appleAvailable && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={12}
            style={{ width: '100%', height: 48, marginTop: 12 }}
            onPress={handleAppleSignIn}
          />
        )}

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('auth.orContinueWith')}</Text>
          <View style={styles.dividerLine} />
        </View>

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
        <View style={styles.phoneField}>
          <Text style={styles.fieldLabel}>{t('common.phoneNumber')}</Text>
          <View style={styles.phoneRow}>
            <TouchableOpacity
              style={styles.countryCodeButton}
              onPress={() => setCountryPickerVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.countryCodeText} numberOfLines={1}>
                {selectedCountryCode || t('auth.selectCountryCode')}
              </Text>
              <Ionicons name="chevron-down" size={14} color={Colors.textMuted} />
            </TouchableOpacity>
            <Controller
              control={control}
              name="phoneNumber"
              render={({ field: { onChange, value } }) => (
                <View style={styles.phoneInputWrapper}>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder={t('auth.phoneNumberPlaceholder')}
                    placeholderTextColor={Colors.textMuted}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                  />
                </View>
              )}
            />
          </View>
          {errors.countryCode?.message && (
            <Text style={styles.errorText}>{errors.countryCode.message}</Text>
          )}
        </View>

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

      <Modal
        visible={countryPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCountryPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCountryPickerVisible(false)}
        >
          <TouchableOpacity style={styles.modalSheet} activeOpacity={1} onPress={() => {}}>
            <Text style={styles.modalTitle}>{t('auth.selectCountryCode')}</Text>
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => item.code}
              style={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryOption}
                  onPress={() => {
                    setValue('countryCode', item.code, { shouldValidate: true });
                    setCountryPickerVisible(false);
                  }}
                >
                  <Text style={styles.countryOptionText}>{item.name}</Text>
                  <Text style={styles.countryOptionCode}>{item.code}</Text>
                </TouchableOpacity>
              )}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
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
    marginBottom: 4,
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

  phoneField: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 6,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    minWidth: 92,
    height: 48,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: Colors.inputBackground,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    flexShrink: 1,
  },
  phoneInputWrapper: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: Colors.inputBackground,
  },
  phoneInput: {
    fontSize: 15,
    color: Colors.text,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalList: { flexGrow: 0 },
  countryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  countryOptionText: {
    fontSize: 15,
    color: Colors.text,
    flexShrink: 1,
  },
  countryOptionCode: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    marginStart: 12,
  },
});
