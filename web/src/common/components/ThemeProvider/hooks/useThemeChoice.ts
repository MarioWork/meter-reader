import { useEffect, useState, useSyncExternalStore } from 'react';
import type { ThemeUtil } from '@app-types/utility';
import {
  applyTheme,
  prefersDarkScheme,
  readStoredTheme,
  resolveTheme,
  storeTheme,
  subscribeToDarkScheme,
} from '@utils/themeUtils';

// The stored choice, the device's light or dark setting, and the two resolved into what the page shows. A change of
// either (the user picks, or the device switches) restyles the page at once.
export function useThemeChoice() {
  const [theme, setChosenTheme] = useState(readStoredTheme);
  const prefersDark = useSyncExternalStore(subscribeToDarkScheme, prefersDarkScheme);

  const appliedTheme = resolveTheme(theme, prefersDark);

  // The page outside React (the <html> class, the browser's theme colour) follows the applied theme.
  useEffect(() => {
    applyTheme(appliedTheme);
  }, [appliedTheme]);

  function setTheme(nextTheme: ThemeUtil) {
    storeTheme(nextTheme);
    setChosenTheme(nextTheme);
  }

  return { theme, appliedTheme, setTheme };
}
