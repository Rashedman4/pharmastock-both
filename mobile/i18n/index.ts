import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
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

export async function changeLanguage(lang: 'en' | 'ar') {
  await SecureStore.setItemAsync(STORAGE_KEYS.LANGUAGE, lang);
  await i18n.changeLanguage(lang);
  const isRTL = lang === 'ar';
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
  }
}

export default i18n;
