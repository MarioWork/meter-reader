import { BASE_ROUTES_PATHS } from '../../src/application/routes/routesUtils';
import { expect, test } from '../fixtures/app.fixture';

test('home shows the hello world heading', async ({ page }) => {
  await page.goto(BASE_ROUTES_PATHS.HOME);

  await expect(page.getByRole('heading', { name: 'Hello world' })).toBeVisible();
});
