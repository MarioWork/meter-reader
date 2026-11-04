import { ThemeUtil } from '@app-types/utility';
import { thisYearCostsPath } from '../../src/common/utils/historyFilterUtils';
import { expect, test } from '../fixtures/app.fixture';
import { pageRoot } from '../fixtures/theme.fixture';
import { AppSidebar } from '../pages/AppSidebar.page';
import { SettingsPage } from '../pages/SettingsPage.page';

const DARK_CLASS = /\bdark\b/;
// WCAG 2.2 target size (minimum), in CSS px.
const MIN_TARGET_PX = 24;

async function openHome(sidebar: AppSidebar) {
  await sidebar.gotoHome();
  await expect(sidebar.navigation).toBeVisible();
}

// The default project is a desktop browser, so these run on a wide screen.
test('shows the sidebar, not the phone header, with Home marked', async ({ page }) => {
  const sidebar = new AppSidebar(page);
  await openHome(sidebar);

  await expect(sidebar.pageLink('Home')).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('banner')).toHaveCount(0);
});

test('opens Costs on this year from the sidebar', async ({ page }) => {
  const sidebar = new AppSidebar(page);
  await openHome(sidebar);

  await sidebar.openPage('Costs');

  await expect(page.getByRole('heading', { level: 1, name: 'Water Readings Costs' })).toBeVisible();
  await expect(sidebar.pageLink('Costs')).toHaveAttribute('aria-current', 'page');
  expect(new URL(page.url()).search).toBe(new URL(thisYearCostsPath(), page.url()).search);
});

test('collapses to icons and expands again, from its edge and with the shortcut', async ({ page }) => {
  const sidebar = new AppSidebar(page);
  await openHome(sidebar);

  await sidebar.collapseFromEdge();
  await expect(sidebar.expandButton).toHaveAttribute('aria-expanded', 'false');
  await expect(sidebar.pageLink('Costs')).toBeVisible();

  await sidebar.toggleWithShortcut();
  await expect(sidebar.collapseButton).toHaveAttribute('aria-expanded', 'true');
});

test('keeps every sidebar target at least 24 px square, collapsed too', async ({ page }) => {
  const sidebar = new AppSidebar(page);
  await openHome(sidebar);
  await sidebar.toggleWithShortcut();
  await expect(sidebar.expandButton).toBeVisible();

  for (const target of await sidebar.targets.all()) {
    const box = await target.boundingBox();

    expect(box?.width).toBeGreaterThanOrEqual(MIN_TARGET_PX);
    expect(box?.height).toBeGreaterThanOrEqual(MIN_TARGET_PX);
  }
});

test.describe('by keyboard', () => {
  test('picks a theme from the sidebar', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    const sidebar = new AppSidebar(page);
    await openHome(sidebar);

    await sidebar.chooseThemeWithKeyboard(ThemeUtil.DARK);

    await expect(pageRoot(page)).toHaveClass(DARK_CLASS);
    await expect(sidebar.themeItem(ThemeUtil.DARK)).toBeChecked();
  });

  test('signs out from the sidebar', async ({ page }) => {
    const sidebar = new AppSidebar(page);
    await openHome(sidebar);

    await sidebar.signOutWithKeyboard();

    await expect(page.getByRole('heading', { name: 'Welcome back!' })).toBeVisible();
  });
});

test('starts collapsed once Settings says so, from the next time the app opens', async ({ page }) => {
  const settingsPage = new SettingsPage(page);
  const sidebar = new AppSidebar(page);
  await settingsPage.goto();
  await expect(sidebar.collapseButton).toHaveAttribute('aria-expanded', 'true');

  await settingsPage.chooseSidebarStart('Collapsed');
  await expect(settingsPage.sidebarStartChoice('Collapsed')).toHaveAttribute('aria-pressed', 'true');
  await settingsPage.reload();

  await expect(sidebar.expandButton).toHaveAttribute('aria-expanded', 'false');
});
