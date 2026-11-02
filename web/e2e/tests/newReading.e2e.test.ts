import { expect, test } from '../fixtures/app.fixture';
import { NewReadingPage } from '../pages/NewReadingPage.page';

test('a reading typed in by hand tops the history with its leading zeros', async ({ page }) => {
  const newReadingPage = new NewReadingPage(page);
  await newReadingPage.goto();

  await newReadingPage.save('00600', '2026-10-31');

  const newest = page.getByRole('table', { name: 'History' }).getByRole('row').nth(1);
  await expect(newest).toContainText('31 Oct 2026');
  await expect(newest).toContainText('00600');
  await expect(newest).toContainText('Not sent');
});
