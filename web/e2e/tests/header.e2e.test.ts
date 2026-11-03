import { ThemeUtil } from '@app-types/utility';
import { expect, test } from '../fixtures/app.fixture';
import { pageRoot, seedStoredTheme } from '../fixtures/theme.fixture';
import { AppHeader } from '../pages/AppHeader.page';

const DARK_CLASS = /\bdark\b/;
// WCAG 2.2 target size (minimum), in CSS px.
const MIN_TARGET_PX = 24;
// The header is the phone's (a wider screen has the sidebar, sidebar.e2e.test.ts).
const PHONE_VIEWPORT = { width: 390, height: 844 };
// A short phone screen, so the page scrolls under the sticky header.
const SHORT_PHONE_VIEWPORT = { width: 390, height: 420 };
// Inside the 56 px header.
const UNDER_HEADER_PX = 20;

async function openHome(header: AppHeader) {
  await header.gotoHome();
  await expect(header.menuButton).toBeVisible();
}

test.describe('by keyboard', () => {
  test.use({ viewport: PHONE_VIEWPORT });

  test('picks a theme from the header menu', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    const header = new AppHeader(page);
    await openHome(header);

    await header.chooseThemeWithKeyboard(ThemeUtil.DARK);

    await expect(pageRoot(page)).toHaveClass(DARK_CLASS);
    await expect(header.themeItem(ThemeUtil.DARK)).toBeChecked();
  });

  test('signs out from the header menu', async ({ page }) => {
    const header = new AppHeader(page);
    await openHome(header);

    await header.signOutWithKeyboard();

    await expect(page.getByRole('heading', { name: 'Welcome back!' })).toBeVisible();
  });
});

test.describe('by touch', () => {
  test.use({ hasTouch: true, viewport: SHORT_PHONE_VIEWPORT });

  test('picks a theme from the header menu', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await seedStoredTheme(page, ThemeUtil.DARK);
    const header = new AppHeader(page);
    await openHome(header);

    await header.tapMenuButton();
    await header.tapThemeItem(ThemeUtil.LIGHT);

    await expect(pageRoot(page)).not.toHaveClass(DARK_CLASS);
  });

  test('signs out from the header menu', async ({ page }) => {
    const header = new AppHeader(page);
    await openHome(header);

    await header.tapMenuButton();
    await header.tapSignOut();

    await expect(page.getByRole('heading', { name: 'Welcome back!' })).toBeVisible();
  });

  test('keeps every menu target at least 24 px square', async ({ page }) => {
    const header = new AppHeader(page);
    await openHome(header);

    await header.tapMenuButton();
    await expect(header.signOutItem).toBeVisible();

    const targets = [header.menuButton, ...(await header.menuItems.all())];
    for (const target of targets) {
      const box = await target.boundingBox();

      expect(box?.width).toBeGreaterThanOrEqual(MIN_TARGET_PX);
      expect(box?.height).toBeGreaterThanOrEqual(MIN_TARGET_PX);
    }
  });

  test('never hides a focused control under the sticky header', async ({ page }) => {
    const header = new AppHeader(page);
    await openHome(header);
    await header.tabPastHeader();
    await header.scrollFocusedElementTo(UNDER_HEADER_PX);

    // Tab onto the same control again: the browser scrolls it into view, clear of the header.
    await header.tabPastHeader();

    const headerBox = await header.banner.boundingBox();
    const focusedBox = await header.focusedElement.boundingBox();
    const headerBottom = (headerBox?.y ?? 0) + (headerBox?.height ?? 0);

    expect(focusedBox?.y).toBeGreaterThanOrEqual(headerBottom);
  });
});
