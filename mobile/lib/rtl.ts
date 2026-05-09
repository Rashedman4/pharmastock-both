import { I18nManager } from 'react-native';

export const isRTL = I18nManager.isRTL;

export const rtlStyle = (ltrStyle: object, rtlStyleObj: object) =>
  isRTL ? rtlStyleObj : ltrStyle;

export const flipForRTL = { transform: [{ scaleX: isRTL ? -1 : 1 }] };

export const rowDirection: 'row' | 'row-reverse' = isRTL ? 'row-reverse' : 'row';

export const textAlign: 'left' | 'right' = isRTL ? 'right' : 'left';

export const directionArrow = isRTL ? '‹' : '›';
