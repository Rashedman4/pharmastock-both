import React, { useMemo } from 'react';
import MarkdownDisplay from 'react-native-markdown-display';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/lib/theme';

interface Props {
  children: string;
  /** `ar` renders right-to-left. */
  lang?: 'en' | 'ar';
}

/**
 * Renders announcement Markdown.
 *
 * `react-native-markdown-display` is pure JS, so this ships in an OTA update —
 * no native rebuild needed. Raw HTML is never rendered (markdown-it runs with
 * `html: false`, its default), and links open in the in-app browser instead of
 * navigating away.
 *
 * Direction is applied on the block styles rather than on a wrapper, because
 * the library renders each block as its own <Text>/<View> and a wrapper's
 * writingDirection would not reach them.
 */
export function Markdown({ children, lang = 'en' }: Props) {
  const { colors } = useTheme();
  const isArabic = lang === 'ar';

  const styles = useMemo(() => {
    const direction = isArabic
      ? ({ writingDirection: 'rtl' as const, textAlign: 'right' as const })
      : ({ writingDirection: 'ltr' as const, textAlign: 'left' as const });

    return {
      body: {
        fontSize: 16,
        lineHeight: 24,
        color: colors.textSecondary,
        ...direction,
      },
      heading1: {
        fontSize: 22,
        fontWeight: '700' as const,
        color: colors.textPrimary,
        marginTop: 12,
        marginBottom: 8,
        ...direction,
      },
      heading2: {
        fontSize: 19,
        fontWeight: '700' as const,
        color: colors.textPrimary,
        marginTop: 12,
        marginBottom: 6,
        ...direction,
      },
      heading3: {
        fontSize: 17,
        fontWeight: '700' as const,
        color: colors.textPrimary,
        marginTop: 10,
        marginBottom: 6,
        ...direction,
      },
      paragraph: {
        marginTop: 0,
        marginBottom: 12,
        ...direction,
      },
      strong: { fontWeight: '700' as const, color: colors.textPrimary },
      em: { fontStyle: 'italic' as const },
      link: { color: colors.accent, textDecorationLine: 'underline' as const },
      bullet_list: { marginBottom: 12 },
      ordered_list: { marginBottom: 12 },
      list_item: { ...direction, marginBottom: 4 },
      blockquote: {
        backgroundColor: colors.backgroundTertiary,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 12,
      },
      code_inline: {
        backgroundColor: colors.backgroundTertiary,
        color: colors.textPrimary,
        paddingHorizontal: 4,
        borderRadius: 4,
      },
      code_block: {
        backgroundColor: colors.backgroundTertiary,
        borderColor: colors.borderLight,
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
      },
      fence: {
        backgroundColor: colors.backgroundTertiary,
        borderColor: colors.borderLight,
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
      },
      hr: { backgroundColor: colors.borderLight, height: 1, marginVertical: 16 },
      table: {
        borderColor: colors.borderLight,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 12,
      },
      th: { padding: 8, fontWeight: '700' as const, color: colors.textPrimary },
      td: { padding: 8, color: colors.textSecondary },
    };
  }, [isArabic, colors]);

  function handleLinkPress(url: string): boolean {
    WebBrowser.openBrowserAsync(url).catch(() => {});
    // false = we handled it; don't let the library open it itself.
    return false;
  }

  return (
    <MarkdownDisplay style={styles} onLinkPress={handleLinkPress}>
      {children}
    </MarkdownDisplay>
  );
}
