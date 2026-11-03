import type { Locator } from '@playwright/test';
import { expect, test } from '../fixtures/app.fixture';
import { SettingsPage } from '../pages/SettingsPage.page';

type Box = NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>;

async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox();

  if (!box) throw new Error('The element has no box: it is not shown.');

  return box;
}

function bottomOf(box: Box) {
  return box.y + box.height;
}

function rightOf(box: Box) {
  return box.x + box.width;
}

async function openSettings(settings: SettingsPage) {
  await settings.goto();
  await expect(settings.heading).toBeVisible();
}

// The default project is a desktop browser (1280 px), so these run on a screen wide enough for two columns. jsdom has
// no layout, so the columns are checked here rather than in Settings.test.tsx.
test('puts the live preview beside the email fields, and the data backup below both', async ({ page }) => {
  const settings = new SettingsPage(page);
  await openSettings(settings);

  const emailFields = await boxOf(settings.emailFields);
  const messageFields = await boxOf(settings.messageFields);
  const preview = await boxOf(settings.preview);
  const saveButton = await boxOf(settings.saveButton);
  const dataBackup = await boxOf(settings.dataBackup);

  expect(preview.x).toBeGreaterThanOrEqual(rightOf(emailFields));
  expect(preview.x).toBeGreaterThanOrEqual(rightOf(messageFields));
  expect(preview.y).toBeLessThan(bottomOf(emailFields));
  expect(dataBackup.y).toBeGreaterThanOrEqual(bottomOf(saveButton));
  expect(dataBackup.y).toBeGreaterThanOrEqual(bottomOf(preview));
});

test('keeps the whole preview in view while editing the templates, scrolled down', async ({ page }) => {
  const settings = new SettingsPage(page);
  await openSettings(settings);

  await settings.editBodyTemplateScrolledDown();

  await expect(settings.bodyTemplateField).toBeFocused();
  await expect(settings.preview).toBeInViewport({ ratio: 1 });
});
