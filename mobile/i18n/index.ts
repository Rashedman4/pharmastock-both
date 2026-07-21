import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';
import { DevSettings, I18nManager } from 'react-native';
import en from '@/locales/en.json';
import ar from '@/locales/ar.json';
import { STORAGE_KEYS } from '@/constants/storage-keys';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

export async function initI18n() {
  const stored = await SecureStore.getItemAsync(STORAGE_KEYS.LANGUAGE).catch(() => null);
  const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'en';
  const lang = stored ?? (deviceLang === 'ar' ? 'ar' : 'en');

  const isRTL = lang === 'ar';
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
  }

  await i18n.use(initReactI18next).init({
    resources,
    lng: lang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });
}

/**
 * Switches the app language and persists it. If the RTL/LTR direction
 * changes, I18nManager.isRTL will not reflect the new value — and no
 * RTL-dependent layout will update, no matter how "live" the code reading it
 * is — until the JS bundle is actually reloaded. This is native RN/Expo
 * behavior, not something fixable from the JS side: forceRTL() only flips a
 * native flag for the *next* bundle evaluation.
 *
 * There are two ways to trigger that reload, and only one works in a given
 * environment:
 * - `Updates.reloadAsync()` — for built/published apps running through
 *   expo-updates (production, or a dev build with EAS Update configured).
 * - `DevSettings.reload()` — for a dev session connected live to Metro
 *   (`expo start` / `npm run android` with the dev client), where
 *   `Updates.isEnabled` is always false because there's no published update
 *   to reload from. This reloads the current JS bundle straight from Metro,
 *   the same thing the dev menu's "Reload" does.
 *
 * Both resolve to `{ reloaded: true }` without the caller ever seeing the
 * promise settle (the JS context is torn down). When the direction doesn't
 * change, no reload happens and the promise resolves normally.
 */
export async function changeLanguage(lang: 'en' | 'ar'): Promise<{ reloaded: boolean }> {
  await SecureStore.setItemAsync(STORAGE_KEYS.LANGUAGE, lang);
  await i18n.changeLanguage(lang);

  const willBeRTL = lang === 'ar';
  const needsReload = I18nManager.isRTL !== willBeRTL;
  if (!needsReload) {
    return { reloaded: false };
  }

  I18nManager.forceRTL(willBeRTL);

  if (Updates.isEnabled) {
    await Updates.reloadAsync();
    return { reloaded: true };
  }

  if (__DEV__ && typeof DevSettings.reload === 'function') {
    DevSettings.reload();
    return { reloaded: true };
  }

  // Neither reload path is available — the direction is still persisted
  // correctly for next cold start, the caller just can't auto-reload now.
  console.warn('[i18n] no reload mechanism available; language direction will apply after a manual restart.');
  return { reloaded: false };
}

export default i18n;
