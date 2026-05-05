import { create } from 'zustand';

interface UiState {
  isRTL: boolean;
  language: 'en' | 'ar';
  setLanguage: (lang: 'en' | 'ar') => void;
}

export const useUiStore = create<UiState>((set) => ({
  isRTL: false,
  language: 'en',
  setLanguage: (lang) => set({ language: lang, isRTL: lang === 'ar' }),
}));
