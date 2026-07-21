import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';
import { I18nManager } from 'react-native';
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
 * changes, I18nManager only fully applies it natively after the JS bundle
 * is reloaded — so this triggers that reload itself (via expo-updates) and
 * resolves to `{ reloaded: true }` without the caller ever seeing the
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

  if (!Updates.isEnabled) {
    // Expo Go / dev-client builds without the native expo-updates module
    // linked in yet (e.g. before the first post-install native rebuild)
    // can't reload themselves — the direction is still persisted correctly
    // for next cold start, the caller just can't auto-reload this session.
    console.warn('[i18n] expo-updates is not enabled; language direction will apply after a manual restart.');
    return { reloaded: false };
  }

  await Updates.reloadAsync();
  return { reloaded: true };
}

export default i18n;
