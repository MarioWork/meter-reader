import type { Page } from '@playwright/test';
import type { PhotoFile } from '../fixtures/photo.fixture';
import { READING_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

export class NewReadingPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto(READING_ROUTES_PATHS.NEW);
  }

  // The camera button on a phone; Playwright hands the file over as the camera would.
  async takePhoto(photo: PhotoFile) {
    await this.page.getByLabel('Take a photo').setInputFiles(photo);
    await this.page.getByRole('img', { name: 'The meter, as it will be saved' }).waitFor();
  }

  async save(digits: string, date: string) {
    await this.page.getByRole('textbox', { name: 'Reading' }).fill(digits);
    await this.page.getByLabel('Date').fill(date);
    await this.page.getByRole('button', { name: 'Save reading' }).click();
  }
}
