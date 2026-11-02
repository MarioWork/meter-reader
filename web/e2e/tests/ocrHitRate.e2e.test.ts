import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '../fixtures/app.fixture';
import { OCR_TIMEOUT_MS, type PhotoFile } from '../fixtures/photo.fixture';
import { NewReadingPage } from '../pages/NewReadingPage.page';

// Not part of the normal run: measures how often OCR reads real meter photos right (issue #5).
//   OCR_PHOTOS_DIR=/path/to/photos yarn ocr-hit-rate
// Each photo is named after the reading it shows, every digit kept: 00529.jpg, or 00529-kitchen.jpg for a second
// photo of the same reading. JPEG or PNG (export iPhone HEIC photos as JPEG first: desktop Chromium cannot open
// HEIC). Every photo goes through the real page: shrink, black and white, Tesseract.
const PHOTOS_DIR = process.env.OCR_PHOTOS_DIR;
const PHOTO_TYPES: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
const EXPECTED_DIGITS = /^\d+/;

type PhotoCase = { photo: PhotoFile; expected: string };

function loadPhotoCases(folder: string): PhotoCase[] {
  return fs
    .readdirSync(folder)
    .filter((name) => Object.hasOwn(PHOTO_TYPES, path.extname(name).toLowerCase()))
    .sort()
    .map((name) => ({
      photo: {
        name,
        mimeType: PHOTO_TYPES[path.extname(name).toLowerCase()],
        buffer: fs.readFileSync(path.join(folder, name)),
      },
      expected: EXPECTED_DIGITS.exec(name)?.[0] ?? '',
    }));
}

test('OCR hit rate on the real meter photos in OCR_PHOTOS_DIR', async ({ page }) => {
  test.skip(!PHOTOS_DIR, 'Set OCR_PHOTOS_DIR to a folder of meter photos to measure the hit rate');
  const photoCases = loadPhotoCases(PHOTOS_DIR ?? '');
  test.setTimeout(OCR_TIMEOUT_MS * (photoCases.length + 1));
  const newReadingPage = new NewReadingPage(page);
  const lines: string[] = [];
  let hits = 0;

  for (const { photo, expected } of photoCases) {
    await newReadingPage.goto();
    await newReadingPage.pickPhoto(photo);
    await expect.poll(() => newReadingPage.hasFinishedWithPhoto(), { timeout: OCR_TIMEOUT_MS }).toBe(true);
    const digitsRead = await newReadingPage.readingField.inputValue();
    const isHit = digitsRead === expected;

    if (isHit) hits += 1;
    lines.push(`${isHit ? 'HIT ' : 'MISS'}  ${photo.name}  expected ${expected}  read ${digitsRead || '(nothing)'}`);
  }

  lines.push(`Hit rate: ${hits} of ${photoCases.length}`);
  console.warn(lines.join('\n'));
  expect(photoCases.length).toBeGreaterThan(0);
});
