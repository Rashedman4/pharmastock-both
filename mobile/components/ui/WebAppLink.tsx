import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { AppColors } from '@/constants/colors';
import { useTheme } from '@/lib/theme';
import { useRTL } from '@/lib/rtl';

export const WEB_APP_URL = 'https://biopharmastock.com';

// Shared action so both placements (profile.tsx and settings/index.tsx) open
// the exact same destination the exact same way — a failed browser open
// never crashes the screen.
export function openWebApp(): void {
  WebBrowser.openBrowserAsync(WEB_APP_URL).catch(() => {});
}

interface WebAppLinkProps {
  style?: StyleProp<ViewStyle>;
  rowLeftStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  showSubtitle?: boolean;
}

// Self-contained row: globe-outline icon, translated label (+ optional
// subtitle), trailing chevron matching the existing row pattern. Style props
// let a screen match its own row look (e.g. profile.tsx's menuRow styles)
// while sensible defaults keep it usable on its own.
export function WebAppLink({
  style,
  rowLeftStyle,
  titleStyle,
  subtitleStyle,
  showSubtitle = true,
}: WebAppLinkProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  const { isRTL } = useRTL();

  return (
    <TouchableOpacity style={[styles.row, style]} onPress={openWebApp} activeOpacity={0.7}>
      <View style={[styles.rowLeft, rowLeftStyle]}>
        <Ionicons name="globe-outline" size={22} color={colors.primaryText} />
        <View>
          <Text style={[styles.title, titleStyle]}>{t('common.visit_website')}</Text>
          {showSubtitle && (
            <Text style={[styles.subtitle, subtitleStyle]}>
              {t('common.visit_website_subtitle')}
            </Text>
          )}
        </View>
      </View>
      <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: c.backgroundTertiary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: c.borderLight,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 15, fontWeight: '700', color: c.primaryText },
  subtitle: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
});
