import { createContext, use } from 'react';
import type { AppliedThemeUtil, ThemeUtil } from '@app-types/utility';

type ThemeContextValue = {
  // What the user picked: light, dark or system.
  theme: ThemeUtil;
  // What is on screen, with system resolved to light or dark.
  appliedTheme: AppliedThemeUtil;
  setTheme: (theme: ThemeUtil) => void;
};

// Filled by ThemeProvider (@components/ThemeProvider), which wraps the whole app.
export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const themeContextValue = use(ThemeContext);

  if (!themeContextValue) throw new Error('useTheme must be called inside a ThemeProvider');

  return themeContextValue;
}
