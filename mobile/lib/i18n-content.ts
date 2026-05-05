import { useTranslation } from 'react-i18next';

export function useLocalizedField() {
  const { i18n } = useTranslation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function getField(obj: any, field: string): string {
    const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
    return (obj[`${field}_${lang}`] as string) || (obj[`${field}_en`] as string) || '';
  };
}
