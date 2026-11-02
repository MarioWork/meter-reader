import type { Page } from '@playwright/test';
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

  // The camera button on a phone; Playwright hands the file over as the camera would. Does not wait for it.
  async pickPhoto(photo: PhotoFile) {
    await this.page.getByLabel('Take a photo').setInputFiles(photo);
  }

  async takePhoto(photo: PhotoFile) {
    await this.pickPhoto(photo);
    await this.page.getByRole('img', { name: 'The meter, as it will be saved' }).waitFor();
  }

  // The photo is done with once OCR has filled the Reading field or found nothing, or the app could not open the
  // file (the photo's error, role="alert"). Poll it with expect.poll.
  async hasFinishedWithPhoto(): Promise<boolean> {
    const hasFilledField = (await this.readingField.inputValue()) !== '';
    const hasFoundNothing = await this.page.getByText(NOTHING_FOUND_STATUS).isVisible();
    const isPhotoRefused = await this.page.getByRole('alert').isVisible();

    return hasFilledField || hasFoundNothing || isPhotoRefused;
  }

  async save(digits: string, date: string) {
    await this.readingField.fill(digits);
    await this.page.getByLabel('Date').fill(date);
    await this.page.getByRole('button', { name: 'Save reading' }).click();
  }
}
