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
  await expect(homePage.dialogCancelButton).toBeFocused();

  await homePage.moveFocusWithTab();
  await expect(homePage.dialogDeleteButton).toBeFocused();
  await homePage.pressFocusedButton();

  await expect(homePage.deleteDialog).toBeHidden();
  await expect(homePage.notification('Reading deleted')).toBeVisible();
  // The table's first row on purpose: the next reading now tops the history.
  await expect(homePage.readingRows.first()).toContainText('1 Sept 2026');
  await expect(homePage.main).not.toContainText('00529');
  await expect(homePage.readingHistory).toBeFocused();
});

test('focus stays inside the open dialog, and Escape cancels and keeps the reading', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  await homePage.openDeleteDialogWithKeyboard(NEWEST_DATE);
  await expect(homePage.deleteDialog).toBeVisible();

  // Round the dialog's two buttons a few times: focus never reaches the page behind it.
  for (let press = 0; press < TAB_PRESSES; press++) {
    await homePage.moveFocusWithTab();
    await expect.poll(() => homePage.isFocusBehindDialog()).toBe(false);
  }

  await homePage.cancelWithEscape();

  await expect(homePage.deleteDialog).toBeHidden();
  await expect(homePage.menuButtonFor(NEWEST_DATE)).toBeFocused();
  await expect(homePage.rowFor(NEWEST_DATE)).toContainText('00529');
});
