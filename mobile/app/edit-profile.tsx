import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { isRTL, rowDirection } from '@/lib/rtl';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import type { AuthUser } from '@/types/user';
import type { UserProfile } from '@/types/api';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phonenumber: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmNewPassword: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const [profileProvider, setProfileProvider] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const isSocial = profileProvider === 'google' || profileProvider === 'apple';

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phonenumber: user?.phonenumber ?? '',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  useEffect(() => {
    authService
      .getMe()
      .then((profile: UserProfile) => {
        setProfileProvider(profile.provider ?? null);
        reset({
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          phonenumber: profile.phonenumber ?? '',
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        });
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, [reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      authService.updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        phonenumber: data.phonenumber || null,
        ...(data.newPassword
          ? { currentPassword: data.currentPassword, newPassword: data.newPassword }
          : {}),
      }),
    onSuccess: async (updated: UserProfile) => {
      await setUser(updated as unknown as AuthUser);
      Alert.alert(t('common.success'), t('profile.profile_updated'));
      router.back();
    },
    onError: (err: unknown) => {
      const apiErr = (
        err as { response?: { data?: { error?: { message?: string; fields?: Record<string, string> } } } }
      )?.response?.data?.error;
      if (apiErr?.fields) {
        const fieldMap: Record<string, keyof FormData> = {
          currentPassword: 'currentPassword',
          newPassword: 'newPassword',
        };
        for (const [key, msg] of Object.entries(apiErr.fields)) {
          const formKey = fieldMap[key] as keyof FormData | undefined;
          if (formKey) setError(formKey, { message: msg });
        }
      }
      const msg = apiErr?.message ?? t('common.error');
      Alert.alert(t('common.error_title'), msg);
    },
  });

  const onSubmit = (data: FormData) => {
    if (data.newPassword) {
      if (data.newPassword.length < 8) {
        setError('newPassword', { message: t('profile.password_min_length') });
        return;
      }
      if (data.newPassword !== data.confirmNewPassword) {
        setError('confirmNewPassword', { message: t('profile.passwords_no_match') });
        return;
      }
    }
    mutation.mutate(data);
  };

  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { flexDirection: rowDirection }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.edit_profile')}</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('profile.account_section')}</Text>

            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={t('common.firstName')}
                  placeholder={t('auth.firstNamePlaceholder')}
                  value={value}
                  onChangeText={onChange}
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
                  error={errors.lastName?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="phonenumber"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={t('common.phoneNumber')}
                  placeholder="+1 234 567 8900"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="phone-pad"
                  error={errors.phonenumber?.message}
                />
              )}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('profile.password_section')}</Text>

            {isSocial ? (
              <View style={styles.socialNote}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={Colors.textMuted}
                  style={styles.socialNoteIcon}
                />
                <Text style={styles.socialNoteText}>
                  {profileProvider === 'google'
                    ? t('profile.social_provider_note_google')
                    : t('profile.social_provider_note_apple')}
                </Text>
              </View>
            ) : (
              <>
                <Controller
                  control={control}
                  name="currentPassword"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label={t('profile.current_password')}
                      placeholder={t('profile.current_password_placeholder')}
                      value={value}
                      onChangeText={onChange}
                      isPassword
                      error={errors.currentPassword?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="newPassword"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label={t('profile.new_password')}
                      placeholder={t('profile.new_password_placeholder')}
                      value={value}
                      onChangeText={onChange}
                      isPassword
                      error={errors.newPassword?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="confirmNewPassword"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label={t('profile.confirm_new_password')}
                      placeholder={t('profile.confirm_new_password_placeholder')}
                      value={value}
                      onChangeText={onChange}
                      isPassword
                      error={errors.confirmNewPassword?.message}
                    />
                  )}
                />
              </>
            )}
          </View>

          <Button
            title={t('profile.save_changes')}
            onPress={handleSubmit(onSubmit)}
            isLoading={mutation.isPending}
            containerStyle={styles.saveBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 48 },
  section: { marginBottom: 28 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  socialNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  socialNoteIcon: { marginTop: 1 },
  socialNoteText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  saveBtn: { marginTop: 8 },
});
