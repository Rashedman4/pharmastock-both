// Colors extracted from /pharma-stock tailwind.config.ts brand tokens:
// royalBlue: '#0A2472', brightTeal: '#00A896', softMint: '#B8E994', lightGray: '#CFD8DC'
export const Colors = {
  primary: '#0A2472',       // royalBlue — main CTAs, links, active state
  primaryDark: '#061540',   // deeper navy for pressed states
  primaryLight: '#1a3a8f',  // lighter navy tint

  accent: '#00A896',        // brightTeal — highlights, success indicators
  accentLight: '#e0f7f5',   // teal tint background

  softMint: '#B8E994',      // softMint — badges, light accents

  background: '#FFFFFF',
  backgroundSecondary: '#F5F7FA',
  backgroundTertiary: '#EEF2FF',

  textPrimary: '#0A2472',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',

  border: '#CFD8DC',
  borderLight: '#E5E7EB',

  success: '#00A896',
  successLight: '#e0f7f5',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#EFF6FF',

  white: '#FFFFFF',
  black: '#000000',

  // Tab bar
  tabBar: '#FFFFFF',
  tabBarActive: '#0A2472',
  tabBarInactive: '#9CA3AF',

  // Inputs
  inputBackground: '#F9FAFB',
  disabled: '#D1D5DB',
  overlay: 'rgba(10, 36, 114, 0.6)',

  // Aliases kept for Phase 2 compat
  surface: '#FFFFFF',
  surfaceDark: '#0A2472',
  text: '#0A2472',
  borderFocus: '#0A2472',
  error: '#EF4444',
} as const;

export type ColorKey = keyof typeof Colors;
