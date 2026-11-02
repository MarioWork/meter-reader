import { BASE_ROUTES_PATHS } from '../../src/application/routes/routesUtils';
import { expect, test } from '../fixtures/app.fixture';

test('home shows the history, newest reading first', async ({ page }) => {
  await page.goto(BASE_ROUTES_PATHS.HOME);

  const rows = page.getByRole('table', { name: 'History' }).getByRole('row');
  // A header row and the first page of ten readings.
  await expect(rows).toHaveCount(11);
  await expect(rows.nth(1)).toContainText('00529');
});

test('home shows how to connect Hotmail when the server cannot send mail', async ({ page, mockMailNotConnected }) => {
  mockMailNotConnected();

  await page.goto(BASE_ROUTES_PATHS.HOME);

  await expect(page.getByText('Hotmail not connected')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('yarn mail:connect');
});
