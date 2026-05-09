import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { rowDirection } from '@/lib/rtl';
import { changeLanguage } from '@/i18n';
import { useUiStore } from '@/stores/ui.store';
import { apiClient } from '@/services/api';
import { API_ROUTES } from '@/constants/api';

type Lang = 'en' | 'ar';

interface LangOption {
  code: Lang;
  label: string;
  nativeLabel: string;
  flag: string;
}

const LANGUAGES: LangOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', flag: '🇸🇦' },
];

export default function LanguageScreen() {
  const { t, i18n } = useTranslation();
  const { setLanguage } = useUiStore();
  const [applying, setApplying] = useState(false);

  const currentLang = i18n.language as Lang;

  const handleSelect = async (lang: Lang) => {
    if (lang === currentLang) return;

    setApplying(true);
    try {
      const wasRTL = currentLang === 'ar';
      const willBeRTL = lang === 'ar';

      await changeLanguage(lang);
      setLanguage(lang);

      // Sync preference to backend so push notifications arrive in the right language
      apiClient.patch(API_ROUTES.meLanguage, { language: lang }).catch(() => {});

      if (wasRTL !== willBeRTL) {
        Alert.alert(
          t('settings.restart_title'),
          t('settings.restart_message'),
          [{ text: t('common.ok') }],
        );
      }
    } finally {
      setApplying(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.list}>
        {LANGUAGES.map((lang, index) => {
          const selected = lang.code === currentLang;
          return (
            <React.Fragment key={lang.code}>
              <TouchableOpacity
                style={[styles.option, { flexDirection: rowDirection }]}
                onPress={() => handleSelect(lang.code)}
                activeOpacity={0.7}
                disabled={applying}
              >
                <View style={[styles.optionLeft, { flexDirection: rowDirection }]}>
                  <Text style={styles.flag}>{lang.flag}</Text>
                  <View>
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                      {lang.nativeLabel}
                    </Text>
                    {lang.nativeLabel !== lang.label && (
                      <Text style={styles.optionSub}>{lang.label}</Text>
                    )}
                  </View>
                </View>

                {applying && selected ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : selected ? (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                ) : (
                  <View style={styles.radioEmpty} />
                )}
              </TouchableOpacity>
              {index < LANGUAGES.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          );
        })}
      </View>

      <Text style={styles.hint}>{t('settings.restart_message')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20 },
  list: {
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  option: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  optionLeft: { alignItems: 'center', gap: 14 },
  flag: { fontSize: 28 },
  optionLabel: { fontSize: 16, fontWeight: '600', color: Colors.text },
  optionLabelSelected: { color: Colors.primary },
  optionSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  radioEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: 16 },
  hint: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
});
