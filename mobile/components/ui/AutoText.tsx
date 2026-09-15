import React from 'react';
import { Text, TextProps, StyleProp, TextStyle } from 'react-native';
import { useContentDirection, containsRTL, isolate } from '@/lib/bidi';

interface AutoTextProps extends Omit<TextProps, 'children' | 'style'> {
  /**
   * The content string. Intentionally a plain string rather than ReactNode:
   * direction has to be derived from the actual text, which is impossible once
   * it has been split into nested elements.
   */
  children: string | null | undefined;
  style?: StyleProp<TextStyle>;
}

/**
 * <Text> for server-supplied content — anything whose language is decided by
 * the API rather than by t(). Applies the correct paragraph direction and
 * alignment for the string it is actually rendering, so an Arabic UI falling
 * back to an English `_en` field still left-aligns that English text (and a
 * mixed Arabic + Latin title still reads as one RTL sentence).
 *
 * Use it instead of <Text> for titles, bodies, company names, chat message
 * content and notification text. Do NOT use it for t() labels, dates or
 * numbers — those follow the UI direction and are already handled.
 *
 * Existing styles are preserved; the direction styles merge on top, so call
 * sites keep their `styles.title` etc. unchanged.
 */
export const AutoText = React.memo(function AutoText({
  children,
  style,
  ...rest
}: AutoTextProps) {
  const text = children ?? '';
  const directionStyle = useContentDirection(text);

  // Only isolate strings that actually mix in Arabic. A pure-Latin string has
  // nothing to resolve, and skipping the wrap keeps English rendering byte-for-
  // byte identical to before this component existed.
  const content = containsRTL(text)
    ? isolate(text, directionStyle.writingDirection)
    : text;

  return (
    <Text {...rest} style={[style, directionStyle]}>
      {content}
    </Text>
  );
});
