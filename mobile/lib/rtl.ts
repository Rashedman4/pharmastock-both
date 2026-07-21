import { useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import i18n from '@/i18n';

/**
 * Live RTL state. Must be a hook, not a module-level constant: in a dev-client
 * session `changeLanguage()` can't always reload the JS bundle (see
 * i18n/index.ts), so anything computed once at import time would stay frozen
 * at whatever direction was active on first module evaluation. Subscribing to
 * i18next's languageChanged event guarantees a re-render (and fresh
 * I18nManager.isRTL read) on every toggle, independent of whether the
 * component also calls useTranslation().
 *
 * Only exposes `isRTL`. Two things NOT to build on top of it:
 * - flexDirection/textAlign: keep those as plain 'row'/static values and let
 *   React Native's built-in RTL auto-mirroring handle the flip. A manual
 *   isRTL-based row/row-reverse switch double-flips against that automatic
 *   mirroring and silently cancels out.
 * - Direction-indicating text glyphs (e.g. '‹'/'›'): these are Unicode
 *   "mirrored" characters, so the OS bidi renderer mirrors them a second time
 *   in an RTL context — same double-flip problem, just via text rendering
 *   instead of layout. Use an Ionicons chevron (`chevron-forward`/
 *   `chevron-back`, manually swapped by `isRTL`) instead — icons aren't
 *   subject to bidi mirroring, so the manual swap is correct there.
 */
export function useRTL() {
  const [isRTL, setIsRTL] = useState(I18nManager.isRTL);

  useEffect(() => {
    const handleLanguageChanged = () => setIsRTL(I18nManager.isRTL);
    i18n.on('languageChanged', handleLanguageChanged);
    return () => i18n.off('languageChanged', handleLanguageChanged);
  }, []);

  return { isRTL };
}
