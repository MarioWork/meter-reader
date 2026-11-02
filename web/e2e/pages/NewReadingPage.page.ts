import { expect, type Page } from '@playwright/test';
import type { PhotoFile } from '../fixtures/photo.fixture';
import { READING_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

const NOTHING_FOUND_STATUS = 'No number found in the photo. Type it in.';

export class NewReadingPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get readingField() {
    return this.page.getByRole('textbox', { name: 'Reading' });
  }

  async goto() {
    await this.page.goto(READING_ROUTES_PATHS.NEW);
  }

  // The camera button on a phone; Playwright hands the file over as the camera would.
  async takePhoto(photo: PhotoFile) {
    await this.page.getByLabel('Take a photo').setInputFiles(photo);
    await this.page.getByRole('img', { name: 'The meter, as it will be saved' }).waitFor();
  }

  // Takes the photo, waits for OCR to finish, and gives back what it put in the Reading field ('' when it found
  // nothing).
  async readPhoto(photo: PhotoFile, timeout: number): Promise<string> {
    await this.takePhoto(photo);

    const nothingFound = this.page.getByText(NOTHING_FOUND_STATUS);
    const isDone = async () => (await this.readingField.inputValue()) !== '' || (await nothingFound.isVisible());

    await expect.poll(isDone, { timeout }).toBe(true);

    return this.readingField.inputValue();
  }

  async save(digits: string, date: string) {
    await this.readingField.fill(digits);
    await this.page.getByLabel('Date').fill(date);
    await this.page.getByRole('button', { name: 'Save reading' }).click();
  }
}
