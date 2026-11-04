import { ThemeUtil, type AppliedThemeUtil } from '@app-types/utility';

// public/theme-init.js reads the same key and resolves the theme the same way, before the app loads: change both
// together.
export const THEME_STORAGE_KEY = 'meter-reader-theme';
const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';
const DARK_CLASS = 'dark';
const THEME_COLOUR_META_SELECTOR = 'meta[name="theme-color"]';

// The browser's toolbar colour for each theme: the page background (src/index.css), also in index.html's
// theme-color tags.
export const THEME_COLOURS: Record<AppliedThemeUtil, string> = {
  [ThemeUtil.LIGHT]: '#eef2f6',
  [ThemeUtil.DARK]: '#06121f',
};

const THEMES: readonly string[] = Object.values(ThemeUtil);

function isTheme(value: string | null): value is ThemeUtil {
  return value !== null && THEMES.includes(value);
}

// Storage can throw (blocked site data, a private window), so a failed read falls back to the device's setting.
export function readStoredTheme(): ThemeUtil {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

    return isTheme(storedTheme) ? storedTheme : ThemeUtil.SYSTEM;
  } catch {
    return ThemeUtil.SYSTEM;
  }
}

// A failed write only means the choice is not remembered next time; it still applies now.
export function storeTheme(theme: ThemeUtil) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Nothing to do: the choice holds for this visit.
  }
}

export function resolveTheme(theme: ThemeUtil, prefersDark: boolean): AppliedThemeUtil {
  if (theme !== ThemeUtil.SYSTEM) return theme;

  return prefersDark ? ThemeUtil.DARK : ThemeUtil.LIGHT;
}

export function prefersDarkScheme() {
  return window.matchMedia(DARK_SCHEME_QUERY).matches;
}

export function subscribeToDarkScheme(onChange: () => void) {
  const darkSchemeQuery = window.matchMedia(DARK_SCHEME_QUERY);

  darkSchemeQuery.addEventListener('change', onChange);

  return () => darkSchemeQuery.removeEventListener('change', onChange);
}

// index.html has one theme-color tag per device setting; both take the applied theme's colour, so a stored choice
// wins over the device here too.
export function applyTheme(appliedTheme: AppliedThemeUtil) {
  document.documentElement.classList.toggle(DARK_CLASS, appliedTheme === ThemeUtil.DARK);

  const themeColourMetas = document.querySelectorAll<HTMLMetaElement>(THEME_COLOUR_META_SELECTOR);

  themeColourMetas.forEach((meta) => {
    meta.content = THEME_COLOURS[appliedTheme];
  });
}
