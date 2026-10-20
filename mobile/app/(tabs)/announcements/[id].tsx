import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { goBackOr } from '@/lib/navigation';
import { stockHref } from '@/lib/stockLink';
import { useRTL } from '@/lib/rtl';
import { formatDate } from '@/lib/format';
import { useAnnouncement } from '@/hooks/useStocks';
import { Markdown } from '@/components/ui/Markdown';
import { AutoText } from '@/components/ui/AutoText';
import type { AppColors } from '@/constants/colors';
import { useTheme } from '@/lib/theme';

/**
 * One company announcement, rendered from Markdown.
 *
 * Arabic readers see the translation with a note saying so and a toggle to the
 * verbatim English original; English readers see the original directly and get
 * no toggle, because there is nothing to switch to.
 */
export default function AnnouncementDetailScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { isRTL } = useRTL();
  const { data: item, isLoading, isError } = useAnnouncement(Number(id));

  const appLang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const [showOriginal, setShowOriginal] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primaryText} />
      </View>
    );
  }

  if (isError || !item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t('common.error')}</Text>
        <TouchableOpacity onPress={() => goBackOr('/(tabs)/news')}>
          <Text style={styles.backLink}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Arabic UI shows Arabic unless the reader asked for the original.
  const showingArabic = appLang === 'ar' && !showOriginal;
  const title = showingArabic ? item.title_ar : item.title_en;
  const content = showingArabic ? item.content_ar : item.content_en;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBackOr('/(tabs)/news')} style={styles.backBtn}>
          <Ionicons
            name={isRTL ? 'chevron-forward' : 'chevron-back'}
            size={26}
            color={colors.primaryText}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {item.symbol}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.symbolRow}>
          <TouchableOpacity
            style={styles.symbolPill}
            onPress={() => router.push(stockHref(item.symbol) as never)}
            activeOpacity={0.7}
          >
            <Text style={styles.symbolText}>{item.symbol}</Text>
          </TouchableOpacity>
        </View>

        <AutoText style={styles.title}>{title}</AutoText>

        {appLang === 'ar' ? (
          <View style={styles.translationBar}>
            {!showOriginal ? (
              <Text style={styles.translationNotice}>
                {t('announcements.translated_notice')}
              </Text>
            ) : null}
            <TouchableOpacity onPress={() => setShowOriginal((v) => !v)}>
              <Text style={styles.translationToggle}>
                {showOriginal
                  ? t('announcements.view_translation')
                  : t('announcements.view_original')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Markdown lang={showingArabic ? 'ar' : 'en'}>{content}</Markdown>

        {item.source_url ? (
          <TouchableOpacity
            style={styles.sourceRow}
            onPress={() => {
              WebBrowser.openBrowserAsync(item.source_url as string).catch(() => {});
            }}
          >
            <Ionicons name="link-outline" size={16} color={colors.accent} />
            <Text style={styles.sourceText}>{t('announcements.source')}</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.date}>
          {formatDate(item.announced_at ?? item.published_date, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: c.backgroundSecondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.borderLight,
  },
  backBtn: { width: 40, justifyContent: 'center' },
  headerSpacer: { width: 40 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.primaryText,
    flex: 1,
    textAlign: 'center',
  },
  content: { padding: 16, paddingBottom: 32 },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  symbolPill: {
    backgroundColor: c.backgroundTertiary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: c.primary + '30',
  },
  symbolText: { fontSize: 13, fontWeight: '700', color: c.primaryText },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: c.textPrimary,
    lineHeight: 28,
    marginBottom: 12,
  },
  translationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: c.backgroundTertiary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  translationNotice: { fontSize: 12, color: c.textSecondary, flex: 1 },
  translationToggle: { fontSize: 12, fontWeight: '700', color: c.accent },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 16,
  },
  sourceText: { fontSize: 14, fontWeight: '600', color: c.accent },
  date: { fontSize: 13, color: c.textMuted },
  errorText: { fontSize: 16, color: c.danger, marginBottom: 12 },
  backLink: { color: c.accent, fontWeight: '600' },
});
