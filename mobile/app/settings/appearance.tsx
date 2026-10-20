import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { AppColors } from '@/constants/colors';
import { useTheme } from '@/lib/theme';
import type { ThemeMode } from '@/stores/theme.store';

interface ModeOption {
  mode: ThemeMode;
  labelKey: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const MODES: ModeOption[] = [
  { mode: 'system', labelKey: 'settings.appearance_system', icon: 'phone-portrait-outline' },
  { mode: 'light', labelKey: 'settings.appearance_light', icon: 'sunny-outline' },
  { mode: 'dark', labelKey: 'settings.appearance_dark', icon: 'moon-outline' },
];

/**
 * System / Light / Dark. Same shape as the language screen.
 *
 * Switching is instant — no reload, unlike the language switch, because
 * nothing here depends on a native flag.
 */
export default function AppearanceScreen() {
  const { t } = useTranslation();
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.list}>
        {MODES.map((option, index) => {
          const selected = option.mode === mode;
          return (
            <React.Fragment key={option.mode}>
              <TouchableOpacity
                style={styles.option}
                onPress={() => setMode(option.mode)}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <Ionicons
                    name={option.icon}
                    size={22}
                    color={selected ? colors.primaryText : colors.textMuted}
                  />
                  <Text
                    style={[styles.optionLabel, selected && styles.optionLabelSelected]}
                  >
                    {t(option.labelKey)}
                  </Text>
                </View>

                {selected ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primaryText} />
                ) : (
                  <View style={styles.radioEmpty} />
                )}
              </TouchableOpacity>
              {index < MODES.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          );
        })}
      </View>

      <Text style={styles.hint}>{t('settings.appearance_hint')}</Text>
    </View>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background, padding: 20 },
    list: {
      backgroundColor: c.backgroundTertiary,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borderLight,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    optionLabel: { fontSize: 16, fontWeight: '600', color: c.text },
    optionLabelSelected: { color: c.primaryText },
    radioEmpty: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: c.borderLight,
    },
    divider: { height: 1, backgroundColor: c.borderLight, marginHorizontal: 16 },
    hint: {
      fontSize: 13,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: 20,
      lineHeight: 18,
      paddingHorizontal: 8,
    },
  });
