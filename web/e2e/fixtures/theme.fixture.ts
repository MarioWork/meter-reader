import type { Locator, Page } from '@playwright/test';
import type { ThemeUtil } from '@app-types/utility';
import { THEME_STORAGE_KEY } from '../../src/common/utils/themeUtils';

// The app's own module entry, as the dev server serves it.
const APP_ENTRY = '**/src/main.tsx';
// CSS selectors on purpose: <html> carries the theme class and <meta> the browser's colour, and neither has an
// accessible role or name to query by.
const PAGE_ROOT_SELECTOR = 'html';
const THEME_COLOUR_TAG_SELECTOR = 'meta[name="theme-color"]';

export function pageRoot(page: Page): Locator {
  return page.locator(PAGE_ROOT_SELECTOR);
}

// One per device setting (light, dark), in index.html.
export function themeColourTags(page: Page): Locator {
  return page.locator(THEME_COLOUR_TAG_SELECTOR);
}

// A theme the user picked on an earlier visit, in storage before the page's first script runs.
export async function seedStoredTheme(page: Page, theme: ThemeUtil) {
  await page.addInitScript(({ storageKey, storedTheme }) => window.localStorage.setItem(storageKey, storedTheme), {
    storageKey: THEME_STORAGE_KEY,
    storedTheme: theme,
  });
}

// Stops the app's bundle from loading, so only the pre-paint script (public/theme-init.js) can set the theme.
export async function blockAppBundle(page: Page) {
  await page.route(APP_ENTRY, (route) => route.abort());
}
