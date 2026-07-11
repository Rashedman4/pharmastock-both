import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, View, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/colors';
import { changeLanguage } from '@/i18n';
import { useUiStore } from '@/stores/ui.store';

interface LanguageToggleProps {
  style?: StyleProp<ViewStyle>;
}

export function LanguageToggle({ style }: LanguageToggleProps = {}) {
  const { t, i18n } = useTranslation();
  const { setLanguage } = useUiStore();
  const [switching, setSwitching] = useState(false);

  const currentLang = i18n.language as 'en' | 'ar';
  const nextLang: 'en' | 'ar' = currentLang === 'en' ? 'ar' : 'en';
  const label = currentLang === 'en' ? 'عربي' : 'EN';

  const handleToggle = async () => {
    if (switching) return;
    setSwitching(true);
    try {
      const wasRTL = currentLang === 'ar';
      const willBeRTL = nextLang === 'ar';
      await changeLanguage(nextLang);
      setLanguage(nextLang);
      if (wasRTL !== willBeRTL) {
        Alert.alert(
          t('settings.restart_title'),
          t('settings.restart_message'),
          [{ text: t('common.ok') }],
        );
      }
    } finally {
      setSwitching(false);
    }
  };

  return (
    <View style={[styles.row, style]}>
      <TouchableOpacity style={styles.btn} onPress={handleToggle} disabled={switching}>
        <Ionicons name="language-outline" size={15} color={Colors.primary} />
        <Text style={styles.label}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
});
