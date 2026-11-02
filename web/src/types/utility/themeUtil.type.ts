// The look the user picked: light, dark, or whatever the device is set to (system, the default).
export const ThemeUtil = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export type ThemeUtil = (typeof ThemeUtil)[keyof typeof ThemeUtil];

// The look actually on screen: system resolved to light or dark.
export type AppliedThemeUtil = Exclude<ThemeUtil, typeof ThemeUtil.SYSTEM>;
