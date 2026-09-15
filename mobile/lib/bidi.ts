import { useMemo } from 'react';
import { I18nManager } from 'react-native';
import { useRTL } from '@/lib/rtl';

export type Direction = 'rtl' | 'ltr';

/**
 * Bidi handling for *server-supplied content* — news/breakthrough/daily-update
 * titles and bodies, chat messages, notification text. Hardcoded UI labels go
 * through t() and follow the UI direction, so they don't belong here.
 *
 * Content direction is NOT the UI direction. `useLocalizedField` falls back to
 * the `_en` field when an `_ar` one is missing, so an Arabic UI regularly
 * renders English content (and vice-versa). Anything keyed off
 * `I18nManager.isRTL` gets that case wrong, which is why this module derives
 * direction from the string being rendered.
 *
 * Three separate levers are needed, because the two platforms disagree about
 * which ones exist (verified against react-native 0.81.5 sources):
 *
 * 1. `textAlign` — controls the visual edge. Supported on both platforms, but
 *    BOTH swap 'left' <-> 'right' when the surface is RTL
 *    (iOS: Libraries/Text/RCTTextAttributes.mm, the `_layoutDirection ==
 *    RightToLeft` branch; Android: views/text/TextAttributeProps.java
 *    `getTextAlignment`, plus ReactBaseTextShadowNode.getTextAlign). So the
 *    value handed to the style has to be pre-compensated — see
 *    `useContentDirection`.
 * 2. `writingDirection` — sets the paragraph's base embedding level. iOS only:
 *    it maps to NSParagraphStyle.baseWritingDirection, while Android drops it
 *    on the floor (views/text/TextAttributeProps.java handles
 *    TA_KEY_BEST_WRITING_DIRECTION with a bare `break;`).
 * 3. Unicode isolates (`isolate`) — the only paragraph-direction lever that
 *    works on Android, because it lives in the string itself rather than in a
 *    style. This is what actually fixes mixed Arabic + Latin content there.
 */

// Arabic, Arabic Supplement, Arabic Extended-A, and the two presentation-form
// blocks. Deliberately excludes Hebrew/Syriac — this app only ships ar/en.
const RTL_CHAR_PATTERN = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
// Strong LTR: Basic Latin letters plus Latin-1 Supplement / Extended-A/B.
const LTR_CHAR_PATTERN = /[A-Za-z\u00C0-\u024F]/g;

/**
 * Share of strong characters that must be RTL for the paragraph to count as
 * RTL. An Arabic sentence about a US-listed pharma company carries a lot of
 * Latin — tickers, drug codes, company names — so requiring a majority would
 * misclassify it. 0.3 is the same threshold Chromium and ICU use for "is this
 * run predominantly RTL".
 */
const RTL_DOMINANCE_THRESHOLD = 0.3;

// Unicode bidi isolate controls (all zero-width formatting characters).
const LRI = '\u2066'; // LEFT-TO-RIGHT ISOLATE
const RLI = '\u2067'; // RIGHT-TO-LEFT ISOLATE
const FSI = '\u2068'; // FIRST STRONG ISOLATE
const PDI = '\u2069'; // POP DIRECTIONAL ISOLATE

function countMatches(text: string, pattern: RegExp): number {
  // `pattern` is a module-level /g regex; String.match resets lastIndex itself.
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

/** True when the string contains at least one strongly-directional character. */
export function hasStrongCharacters(text: string): boolean {
  if (!text) return false;
  return countMatches(text, RTL_CHAR_PATTERN) + countMatches(text, LTR_CHAR_PATTERN) > 0;
}

/** True when the string contains any Arabic-script character. */
export function containsRTL(text: string): boolean {
  if (!text) return false;
  return countMatches(text, RTL_CHAR_PATTERN) > 0;
}

/**
 * Dominant direction of a content string.
 *
 * Deliberately NOT the Unicode "first strong character" rule that the platform
 * falls back to on its own. The API's Arabic titles routinely lead with a Latin
 * company name or ticker ("Armata Pharmaceuticals تعلن عن موافقة FDA على
 * AP-SA02"), and first-strong classifies that entire Arabic sentence as an LTR
 * paragraph — which is exactly the corruption this replaces: the neutrals
 * around the Latin runs resolve at the wrong embedding level and fragments land
 * on the wrong side of the line.
 *
 * Returns 'ltr' for a string with no strong characters at all (digits,
 * punctuation, emoji); `useContentDirection` substitutes the UI direction for
 * that case, since there is genuinely nothing in the string to detect.
 */
export function detectDirection(text: string): Direction {
  if (!text) return 'ltr';
  const rtl = countMatches(text, RTL_CHAR_PATTERN);
  if (rtl === 0) return 'ltr';
  const ltr = countMatches(text, LTR_CHAR_PATTERN);
  const strong = rtl + ltr;
  if (strong === 0) return 'ltr';
  return rtl / strong >= RTL_DOMINANCE_THRESHOLD ? 'rtl' : 'ltr';
}

/**
 * Wraps a string in Unicode isolates so embedded Latin runs (tickers, drug
 * codes, company names) resolve against the intended paragraph direction
 * instead of against whatever the surrounding context happens to be.
 *
 * This is the cross-platform half of the fix: `writingDirection` does the same
 * job on iOS but is a no-op on Android, whereas isolates travel with the string
 * and work everywhere. The controls are zero-width, so they change bidi
 * resolution without changing what the user sees.
 */
export function isolate(text: string, dir: Direction | 'auto' = 'auto'): string {
  if (!text) return text;
  const opening = dir === 'rtl' ? RLI : dir === 'ltr' ? LRI : FSI;
  return `${opening}${text}${PDI}`;
}

export interface ContentDirectionStyle {
  textAlign: 'right' | 'left';
  writingDirection: Direction;
}

/**
 * Style fragment to spread onto a <Text> rendering server content.
 *
 * The `textAlign` returned here is PRE-COMPENSATED and will look inverted if
 * you read it as a visual edge. Both platforms swap 'left' <-> 'right' when the
 * surface is RTL (see the module comment), so to land the text on a given
 * visual edge the opposite keyword has to be passed in an RTL surface:
 *
 *   content | surface | want    | pass
 *   --------+---------+---------+-------
 *   rtl     | rtl     | right   | left
 *   rtl     | ltr     | right   | right
 *   ltr     | rtl     | left    | right
 *   ltr     | ltr     | left    | left
 *
 * which collapses to: pass 'left' when content and surface agree, 'right' when
 * they disagree. That is what makes English content stay left-aligned inside an
 * Arabic UI (the `_en` fallback case) instead of being dragged to the right.
 */
export function useContentDirection(text: string): ContentDirectionStyle {
  const { isRTL: uiRTL } = useRTL();

  return useMemo(() => {
    const contentRTL = hasStrongCharacters(text) ? detectDirection(text) === 'rtl' : uiRTL;
    return {
      textAlign: contentRTL === uiRTL ? 'left' : 'right',
      writingDirection: contentRTL ? 'rtl' : 'ltr',
    };
  }, [text, uiRTL]);
}

/**
 * Non-hook variant for the rare call site that already knows it is outside a
 * component (e.g. building a string for a native API). Reads I18nManager
 * directly, so it will not re-render on a dev-client language toggle the way
 * `useContentDirection` does — prefer the hook inside components.
 */
export function getContentDirectionStyle(text: string): ContentDirectionStyle {
  const uiRTL = I18nManager.isRTL;
  const contentRTL = hasStrongCharacters(text) ? detectDirection(text) === 'rtl' : uiRTL;
  return {
    textAlign: contentRTL === uiRTL ? 'left' : 'right',
    writingDirection: contentRTL ? 'rtl' : 'ltr',
  };
}
