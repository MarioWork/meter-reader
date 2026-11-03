import { expect, test } from '../fixtures/app.fixture';
import { HomePage } from '../pages/HomePage.page';

const NEWEST_DATE = '1 Oct 2026';
// The mock settings' templates filled in for the newest reading, its day written in the long month format.
const NEWEST_SUBJECT = 'Meter reading 1 October 2026';
const NEWEST_BODY = 'Date: 1 October 2026\nReading: 00529';
// An iPhone 14's screen, narrower than Tailwind's `sm` breakpoint.
const PHONE_VIEWPORT = { width: 390, height: 844 };

test('a reading is previewed and sent with its photo, and the history shows it sent', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  await homePage.openSendPreview(NEWEST_DATE);
  await expect(homePage.sendDialog).toContainText('readings@water-provider.example');
  await expect(homePage.sendSubjectField).toHaveValue(NEWEST_SUBJECT);
  await expect(homePage.sendMessageField).toHaveValue(NEWEST_BODY);
  await expect(homePage.attachPhotoSwitch).toBeChecked();
  await homePage.sendFromPreview();

  await expect(homePage.sendDialog).toBeHidden();
  await expect(homePage.notification('Reading sent')).toBeVisible();
  await expect(homePage.rowFor(NEWEST_DATE)).toContainText('Sent 2 Nov 2026');
  await expect(homePage.sendLinkFor(NEWEST_DATE)).toBeHidden();
  // The Send link that opened the preview is gone, so focus goes to the table, never to the top of the page.
  await expect(homePage.readingHistory).toBeFocused();
});

test('Escape closes the preview, sends nothing and gives focus back to the Send link', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  await homePage.openSendPreviewWithKeyboard(NEWEST_DATE);
  await expect(homePage.sendDialog).toBeVisible();
  await homePage.cancelWithEscape();

  await expect(homePage.sendDialog).toBeHidden();
  await expect(homePage.sendLinkFor(NEWEST_DATE)).toBeFocused();
  await expect(homePage.rowFor(NEWEST_DATE)).toContainText('Not sent');
});

test('Send is off while Hotmail is not connected', async ({ page, mockMailNotConnected }) => {
  mockMailNotConnected();
  const homePage = new HomePage(page);
  await homePage.goto();

  await homePage.openSendPreview(NEWEST_DATE);

  await expect(homePage.sendDialog).toContainText('Hotmail is not connected');
  await expect(homePage.sendDialogSendButton).toBeDisabled();
});

test.describe('on a phone', () => {
  test.use({ viewport: PHONE_VIEWPORT });

  test('the preview is a bottom sheet that closes with its Close button, no swipe needed', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.openSendPreview(NEWEST_DATE);
    await expect(homePage.sendMessageField).toHaveValue(NEWEST_BODY);
    await expect(homePage.sendDialog).toBeInViewport();
    // It slides up, so its position settles a moment after it shows.
    await expect.poll(() => homePage.isSendSheetAtBottom()).toBe(true);
    await homePage.closePreview();

    await expect(homePage.sendDialog).toBeHidden();
    await expect(homePage.sendLinkFor(NEWEST_DATE)).toBeFocused();
    await expect(homePage.lastReadingCard).toContainText('Not sent');
  });

  test('Escape closes the sheet and gives focus back to the Send link', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.openSendPreviewWithKeyboard(NEWEST_DATE);
    await expect(homePage.sendDialog).toBeVisible();
    await homePage.cancelWithEscape();

    await expect(homePage.sendDialog).toBeHidden();
    await expect(homePage.sendLinkFor(NEWEST_DATE)).toBeFocused();
  });
});
