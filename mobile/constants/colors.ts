// Colors extracted from /pharma-stock tailwind.config.ts brand tokens:
// royalBlue: '#0A2472', brightTeal: '#00A896', softMint: '#B8E994', lightGray: '#CFD8DC'
//
// `lightColors` is the original palette, value for value — light mode must stay
// pixel-identical to how the app shipped. `darkColors` carries the same keys so
// a screen only ever reads `useTheme().colors` and never branches on the scheme.
//
// Two keys exist for semantic reasons rather than visual ones, and both have
// the SAME light value as the token they split from, so light rendering is
// unaffected:
//
//   surface      — a white *surface* (card, app bar, tab bar). Light #FFFFFF,
//                  same as `white`; dark is the raised navy. Use `white` only
//                  for text/icons sitting on a brand-coloured fill, where the
//                  colour must stay white in both schemes.
//   primaryText  — brand-coloured *text and icons* on a surface (screen
//                  titles, symbol pills, chevrons, spinners). Light #0A2472,
//                  same as `primary`; dark is a light blue, because the dark
//                  `primary` is a fill colour and would be unreadable as text
//                  on a dark surface.
const light = {
  primary: '#0A2472',       // royalBlue — main CTAs, links, active state
  primaryDark: '#061540',   // deeper navy for pressed states
  primaryLight: '#1a3a8f',  // lighter navy tint
  primaryText: '#0A2472',   // brand-coloured text/icons on a surface

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

/** Every colour a screen can read. Both palettes satisfy it. */
export type AppColors = { readonly [K in keyof typeof light]: string };

export const lightColors: AppColors = light;

/**
 * Navy dark palette.
 *
 * `primaryDark` is light here on purpose: in this codebase it is only ever used
 * as strong heading text (auth titles, the profile name, the settings header),
 * never as a pressed background.
 */
export const darkColors: AppColors = {
  primary: '#2B4DB8',       // fills: buttons, the active tab pill
  primaryDark: '#DCE5F8',   // heading text (see note above)
  primaryLight: '#3A5FD0',
  primaryText: '#8FA8FF',   // brand text/icons on a dark surface

  accent: '#19C3AE',
  accentLight: 'rgba(25, 195, 174, 0.15)',

  softMint: '#B8E994',      // sits on the brand gradient; unchanged

  background: '#0B1220',
  backgroundSecondary: '#111A2E',
  backgroundTertiary: '#18233D',

  textPrimary: '#E6EBF5',
  textSecondary: '#A3AEC2',
  textMuted: '#6B778C',

  border: '#24304A',
  borderLight: '#1C2740',

  success: '#19C3AE',
  successLight: 'rgba(25, 195, 174, 0.15)',
  danger: '#F87171',
  dangerLight: 'rgba(248, 113, 113, 0.15)',
  warning: '#FBBF24',
  warningLight: 'rgba(251, 191, 36, 0.15)',
  info: '#60A5FA',
  infoLight: 'rgba(96, 165, 250, 0.15)',

  white: '#FFFFFF',         // text/icons on a brand fill
  black: '#000000',

  tabBar: '#111A2E',
  tabBarActive: '#8FA8FF',
  tabBarInactive: '#6B778C',

  inputBackground: '#111A2E',
  disabled: '#33405E',
  overlay: 'rgba(0, 0, 0, 0.7)',

  surface: '#111A2E',
  surfaceDark: '#18233D',
  text: '#E6EBF5',
  borderFocus: '#8FA8FF',
  error: '#F87171',
};

/**
 * The light palette, kept as a named export so anything written before the
 * theme existed keeps compiling. New code reads `useTheme().colors`.
 */
export const Colors = light;

export type ColorKey = keyof typeof light;
