import { expect, test } from '../fixtures/app.fixture';
import { HomePage } from '../pages/HomePage.page';

const NEWEST_DATE = '1 Oct 2026';

test('a reading is previewed and sent with its photo, and the history shows it sent', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  await homePage.openSendPreview(NEWEST_DATE);
  await expect(homePage.sendDialog).toContainText('readings@water-provider.example');
  await expect(homePage.sendDialog).toContainText('Reading: 00529');
  await expect(homePage.attachPhotoCheckbox).toBeChecked();
  await homePage.sendFromPreview();

  await expect(homePage.sendDialog).toBeHidden();
  await expect(homePage.notification('Reading sent')).toBeVisible();
  await expect(homePage.historyRows.nth(1)).toContainText('Sent 2 Nov 2026');
  await expect(homePage.sendLinkFor(NEWEST_DATE)).toBeHidden();
  // The Send link that opened the preview is gone, so focus goes to the history, never to the top of the page.
  await expect(homePage.historyTable).toBeFocused();
});

test('Escape closes the preview, sends nothing and gives focus back to the Send link', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  await homePage.openSendPreviewWithKeyboard(NEWEST_DATE);
  await expect(homePage.sendDialog).toBeVisible();
  await homePage.cancelWithEscape();

  await expect(homePage.sendDialog).toBeHidden();
  await expect(homePage.sendLinkFor(NEWEST_DATE)).toBeFocused();
  await expect(homePage.historyRows.nth(1)).toContainText('Not sent');
});

test('Send is off while Hotmail is not connected', async ({ page, mockMailNotConnected }) => {
  mockMailNotConnected();
  const homePage = new HomePage(page);
  await homePage.goto();

  await homePage.openSendPreview(NEWEST_DATE);

  await expect(homePage.sendDialog).toContainText('Hotmail is not connected');
  await expect(homePage.sendDialogSendButton).toBeDisabled();
});
