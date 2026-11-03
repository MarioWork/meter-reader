import { BASE_ROUTES_PATHS } from '../../src/application/routes/routesUtils';
import { expect, test } from '../fixtures/app.fixture';
import { HomePage } from '../pages/HomePage.page';

const NEWEST_DATE = '1 Oct 2026';
const NEWEST_PHOTO = `Photo of the ${NEWEST_DATE} reading`;

test('home shows the last reading on top and the earlier ones as cards', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  await expect(homePage.lastReadingCard).toContainText('00529');
  await expect(homePage.lastReadingCard).toContainText('Not sent');
  // The first page of ten readings: the last reading, then nine cards.
  await expect(homePage.earlierCards).toHaveCount(9);
  await expect(homePage.earlierCards.first()).toContainText('1 Sept 2026');
  await expect(homePage.newReadingLink).toBeInViewport();
});

test('scrolling to the end of the history loads the older readings', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  await expect(homePage.earlierCards).toHaveCount(9);

  await homePage.scrollToEndOfHistory();

  await expect(homePage.earlierCards).toHaveCount(13);
  await expect(homePage.earlierCards.last()).toContainText('00412');
  await expect(homePage.historyCount).toHaveText('Showing 14 of 14 readings');
  await expect(homePage.loadMoreButton).toBeHidden();
});

test("a reading's photo opens from its menu, and closing it gives focus back to the menu button", async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  await homePage.openPhoto(NEWEST_DATE);
  await expect(homePage.photoDialog(NEWEST_PHOTO).getByRole('img')).toBeVisible();
  await homePage.closePhoto(NEWEST_PHOTO);

  await expect(homePage.photoDialog(NEWEST_PHOTO)).toBeHidden();
  await expect(homePage.menuButtonFor(NEWEST_DATE)).toBeFocused();
});

test('home shows how to connect Hotmail when the server cannot send mail', async ({ page, mockMailNotConnected }) => {
  mockMailNotConnected();

  await page.goto(BASE_ROUTES_PATHS.HOME);

  const banner = page.getByRole('status');
  await expect(banner).toContainText('Hotmail not connected');
  await expect(banner).toContainText('yarn mail:connect');
});
