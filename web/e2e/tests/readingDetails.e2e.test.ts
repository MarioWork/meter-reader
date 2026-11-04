import { READING_ROUTES_PATHS } from '../../src/application/routes/routesUtils';
import { expect, test } from '../fixtures/app.fixture';
import { HomePage } from '../pages/HomePage.page';
import { ReadingDetailsPage } from '../pages/ReadingDetailsPage.page';

// The mock history's 1 Aug 2026 reading was sent, with its photo; it is on the first page of every filter below.
const SENT_ID = 12;
const SENT_DATE = '1 Aug 2026';
const SENT_FILTER = '?status=sent';
const SENT_DIGITS = '00511';
// The reading just after it by date, in the whole history whatever Home is filtered to: 1 Sept 2026, which failed.
const NEXT_ID = 13;
const NEXT_DATE = '1 Sept 2026';
const PHONE_VIEWPORT = { width: 390, height: 844 };
// Enough to go round the full-screen photo's one button a few times.
const TAB_PRESSES = 3;

test('a reading opens as its own page from Home, and goes back to the same filters', async ({ page }) => {
  const homePage = new HomePage(page);
  const readingPage = new ReadingDetailsPage(page);
  await homePage.gotoWithSearch(SENT_FILTER);
  const filteredUrl = page.url();

  await homePage.openReadingPage(SENT_DATE);

  await expect(readingPage.title).toHaveText(`Reading of ${SENT_DATE}`);
  await expect(page).toHaveURL(`/readings/${SENT_ID}${SENT_FILTER}`);
  await readingPage.goBackToReadings();
  await expect(page).toHaveURL(filteredUrl);

  await homePage.goBack();
  await expect(readingPage.title).toHaveText(`Reading of ${SENT_DATE}`);
  await homePage.goBack();
  await expect(page).toHaveURL(filteredUrl);
});

test("steps to the next reading and back with the arrow key, keeping Home's filters, and shows the water used", async ({
  page,
}) => {
  const readingPage = new ReadingDetailsPage(page);
  await readingPage.goto(SENT_ID, SENT_FILTER);
  await expect(readingPage.usage('+9 m³ in 31 days')).toBeVisible();

  await readingPage.goToNext();
  await expect(readingPage.title).toHaveText(`Reading of ${NEXT_DATE}`);
  await expect(page).toHaveURL(`${READING_ROUTES_PATHS.details(String(NEXT_ID))}${SENT_FILTER}`);
  await expect(readingPage.usage('+9 m³ in 31 days')).toBeVisible();

  await readingPage.pressLeftArrow();
  await expect(readingPage.title).toHaveText(`Reading of ${SENT_DATE}`);
  await expect(page).toHaveURL(`${READING_ROUTES_PATHS.details(String(SENT_ID))}${SENT_FILTER}`);
  await expect(readingPage.previousLink).toBeVisible();
});

test('the photo opens full screen, keeps focus inside, and Escape gives focus back to it', async ({ page }) => {
  const homePage = new HomePage(page);
  const readingPage = new ReadingDetailsPage(page);
  await homePage.goto();
  await homePage.openReadingPage(SENT_DATE);

  await readingPage.openPhoto();
  await expect(readingPage.fullScreenPhoto(SENT_DATE)).toBeVisible();
  for (let press = 0; press < TAB_PRESSES; press++) {
    await readingPage.moveFocusWithTab();
    await expect.poll(() => readingPage.isFocusBehindDialog()).toBe(false);
  }
  await readingPage.closeWithEscape();

  await expect(readingPage.fullScreenPhoto(SENT_DATE)).toBeHidden();
  await expect(readingPage.photoButton).toBeFocused();
});

test('a wide screen puts the photo beside the digits and the cost', async ({ page }) => {
  const homePage = new HomePage(page);
  const readingPage = new ReadingDetailsPage(page);
  await homePage.goto();
  await homePage.openReadingPage(SENT_DATE);
  await expect(readingPage.photoButton).toBeVisible();

  const photoBox = await readingPage.photoButton.boundingBox();
  const digitsBox = await readingPage.digits(SENT_DIGITS).boundingBox();

  expect(photoBox && digitsBox && digitsBox.x > photoBox.x + photoBox.width).toBe(true);
  await expect(readingPage.card('Email')).toContainText('Photo attached');
});

test.describe('on a phone', () => {
  test.use({ viewport: PHONE_VIEWPORT });

  test('one column: the digits, then Resend, then the photo', async ({ page }) => {
    const readingPage = new ReadingDetailsPage(page);
    await readingPage.goto(SENT_ID);
    await expect(readingPage.photoButton).toBeVisible();

    const digitsBox = await readingPage.digits(SENT_DIGITS).boundingBox();
    const resendBox = await readingPage.resendAction.boundingBox();
    const photoBox = await readingPage.photoButton.boundingBox();

    expect(digitsBox && resendBox && resendBox.y > digitsBox.y).toBe(true);
    expect(resendBox && photoBox && photoBox.y > resendBox.y).toBe(true);
  });
});
