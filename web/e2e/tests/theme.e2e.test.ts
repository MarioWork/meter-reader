import { BASE_ROUTES_PATHS } from '../../src/application/routes/routesUtils';
import { ThemeUtil } from '@app-types/utility';
import { THEME_COLOURS } from '../../src/common/utils/themeUtils';
import { expect, test } from '../fixtures/app.fixture';
import { blockAppBundle, pageRoot, seedStoredTheme, themeColourTags } from '../fixtures/theme.fixture';

const DARK_CLASS = /\bdark\b/;
const THEME_COLOUR_TAG_COUNT = 2;

test('follows the device, and switches when the device switches', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(BASE_ROUTES_PATHS.HOME);

  const html = pageRoot(page);
  await expect(page.getByRole('heading', { name: 'Water Readings' })).toBeVisible();
  await expect(html).not.toHaveClass(DARK_CLASS);

  await page.emulateMedia({ colorScheme: 'dark' });

  await expect(html).toHaveClass(DARK_CLASS);
});

test('keeps the stored choice over the device setting, browser theme colour included', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await seedStoredTheme(page, ThemeUtil.DARK);

  await page.goto(BASE_ROUTES_PATHS.HOME);

  await expect(page.getByRole('heading', { name: 'Water Readings' })).toBeVisible();
  await expect(pageRoot(page)).toHaveClass(DARK_CLASS);

  // Both tags, the light-device one included: the stored choice wins there too.
  const colourTags = themeColourTags(page);
  await expect(colourTags).toHaveCount(THEME_COLOUR_TAG_COUNT);
  for (const colourTag of await colourTags.all()) {
    await expect(colourTag).toHaveAttribute('content', THEME_COLOURS[ThemeUtil.DARK]);
  }
});

test('sets the theme before the app loads, so a dark page never flashes light', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await seedStoredTheme(page, ThemeUtil.DARK);
  await blockAppBundle(page);

  await page.goto(BASE_ROUTES_PATHS.HOME);

  await expect(pageRoot(page)).toHaveClass(DARK_CLASS);
});
