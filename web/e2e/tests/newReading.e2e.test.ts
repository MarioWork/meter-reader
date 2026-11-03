import { expect, test } from '../fixtures/app.fixture';
import { makeCameraPhoto, makeMeterPhoto, OCR_TIMEOUT_MS, readPhotoSize } from '../fixtures/photo.fixture';
import { HomePage } from '../pages/HomePage.page';
import { NewReadingPage } from '../pages/NewReadingPage.page';

// A 12-megapixel phone camera, 4:3.
const CAMERA_WIDTH = 4032;
const CAMERA_HEIGHT = 3024;
const PHOTO_MAX_BYTES = 2_500_000;
// A reading is saved as today's, so today is fixed: 31 October 2026.
const TODAY = new Date(2026, 9, 31, 12);

test('a reading typed in by hand tops the history with its leading zeros', async ({ page }) => {
  await page.clock.setFixedTime(TODAY);
  const newReadingPage = new NewReadingPage(page);
  await newReadingPage.goto();

  await newReadingPage.save('00600');

  // The table's first row on purpose: the new reading tops the history.
  const newest = new HomePage(page).readingRows.first();
  await expect(newest).toContainText('31 Oct 2026');
  await expect(newest).toContainText('00600');
  await expect(newest).toContainText('Not sent');
  // The polite live region screen readers announce.
  const notifications = page.getByRole('region', { name: 'Notifications' });
  await expect(notifications.getByRole('dialog', { name: 'Reading saved' })).toBeVisible();
});

test('a camera photo is shrunk to a JPEG of at most 2000 px and saved with its reading', async ({ page }) => {
  await page.clock.setFixedTime(TODAY);
  const newReadingPage = new NewReadingPage(page);
  await newReadingPage.goto();
  const cameraPhoto = await makeCameraPhoto(page, CAMERA_WIDTH, CAMERA_HEIGHT);
  const upload = page.waitForRequest((request) => request.method() === 'POST' && request.url().endsWith('/api/photos'));

  await newReadingPage.takePhoto(cameraPhoto);
  await newReadingPage.save('00600');

  const uploaded = (await upload).postDataBuffer() ?? Buffer.alloc(0);
  expect(uploaded.length).toBeLessThan(PHOTO_MAX_BYTES);
  expect(await readPhotoSize(page, uploaded)).toEqual({ width: 2000, height: 1500, isJpeg: true });
  const homePage = new HomePage(page);
  await homePage.openPhoto('31 Oct 2026');
  await expect(homePage.photoDialog('Photo of the 31 Oct 2026 reading').getByRole('img')).toBeVisible();
});

test('the number in a meter photo is read into the reading field, where it can still be changed', async ({ page }) => {
  test.setTimeout(OCR_TIMEOUT_MS * 2);
  const newReadingPage = new NewReadingPage(page);
  await newReadingPage.goto();
  const meterPhoto = await makeMeterPhoto(page, '00612');

  await newReadingPage.takePhoto(meterPhoto);
  await newReadingPage.readWholePhoto();

  await expect.poll(() => newReadingPage.hasFinishedWithPhoto(), { timeout: OCR_TIMEOUT_MS }).toBe(true);
  await expect(newReadingPage.readingField).toHaveValue('00612');
  await expect(newReadingPage.readingField).toBeEditable();
});
