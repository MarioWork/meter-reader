import { expect, test } from '../fixtures/app.fixture';
import { HomePage } from '../pages/HomePage.page';

const NEWEST_DATE = '1 Oct 2026';
// Enough to go round the dialog's two buttons twice.
const TAB_PRESSES = 4;

test('a reading is deleted from the history with the keyboard alone', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  await homePage.openDeleteDialogWithKeyboard(NEWEST_DATE);
  await expect(homePage.deleteDialog).toBeVisible();
  await expect(homePage.deleteDialog.getByRole('button', { name: 'Cancel' })).toBeFocused();

  await homePage.pressKey('Tab');
  await expect(homePage.deleteDialog.getByRole('button', { name: 'Delete' })).toBeFocused();
  await homePage.pressKey('Enter');

  await expect(homePage.deleteDialog).toBeHidden();
  await expect(homePage.historyRows.nth(1)).toContainText('1 Sept 2026');
  await expect(homePage.historyTable).not.toContainText('00529');
});

test('focus stays inside the open dialog, and Escape cancels and keeps the reading', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  await homePage.openDeleteDialogWithKeyboard(NEWEST_DATE);
  await expect(homePage.deleteDialog).toBeVisible();

  // Round the dialog's two buttons a few times: focus never reaches the page behind it.
  for (let press = 0; press < TAB_PRESSES; press++) {
    await homePage.pressKey('Tab');
    const isFocusOnPageBehind = await page.evaluate(() => {
      const focused = document.activeElement;
      const isInDialog = focused?.closest('dialog') !== null;

      return focused !== document.body && !isInDialog;
    });
    expect(isFocusOnPageBehind).toBe(false);
  }

  await homePage.pressKey('Escape');

  await expect(homePage.deleteDialog).toBeHidden();
  await expect(homePage.deleteButtonFor(NEWEST_DATE)).toBeFocused();
  await expect(homePage.historyRows.nth(1)).toContainText('00529');
});
