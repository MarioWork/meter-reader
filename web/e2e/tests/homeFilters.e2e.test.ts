import { expect, test } from '../fixtures/app.fixture';
import { HomePage } from '../pages/HomePage.page';

// 15 October 2026: "This year" is 1 January to 15 October, which holds ten mock readings, one of them failed.
const TODAY = new Date(2026, 9, 15, 12);
const DATE_PRESET = 'This year';
const STATUS = 'Failed';
const FAILED_READING_DATE = '1 Sept 2026';
const THIS_YEAR_READING_COUNT = 10;
// The Filter button and its sheet, and the cards, are a phone's: an iPhone 14's screen, narrower than Tailwind's `sm`.
const PHONE_VIEWPORT = { width: 390, height: 844 };

test.use({ viewport: PHONE_VIEWPORT });

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(TODAY);
});

test('filters narrow the history, live in the url, and come off with their chips', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  await expect(homePage.earlierCards).toHaveCount(9);

  await homePage.filterBy([DATE_PRESET, STATUS]);

  await expect(homePage.matchingCards).toHaveCount(1);
  await expect(homePage.matchingCards).toContainText(FAILED_READING_DATE);
  await expect(homePage.lastReadingCard).toBeHidden();
  await expect(homePage.activeFilters).toHaveText([DATE_PRESET, STATUS]);
  await expect(page).toHaveURL(/from=2026-01-01&to=2026-10-15&status=failed/);

  await homePage.reload();
  await expect(homePage.matchingCards).toHaveCount(1);

  await homePage.removeFilter(STATUS);
  await expect(homePage.matchingCards).toHaveCount(THIS_YEAR_READING_COUNT);
  await expect(homePage.activeFilters).toHaveText([DATE_PRESET]);

  await homePage.goBack();
  await expect(homePage.matchingCards).toHaveCount(1);

  await homePage.goBack();
  await expect(homePage.lastReadingCard).toContainText('00529');
  await expect(homePage.earlierCards).toHaveCount(9);
});

test('a filter that matches nothing says so, and Clear filters brings the history back', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  await homePage.filterBy(['This month', 'Failed']);

  await expect(homePage.noMatchesHeading).toBeVisible();
  await homePage.clearFilters();

  await expect(homePage.lastReadingCard).toContainText('00529');
  await expect(homePage.filterButton).toBeFocused();
});
