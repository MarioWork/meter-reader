import type { Page } from '@playwright/test';
import type { PhotoFile } from '../fixtures/photo.fixture';
import { READING_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

const NOTHING_FOUND_STATUS = 'No number found in the photo. Type it in.';
const READ_TIMED_OUT_STATUS = "Couldn't read the number from the photo. Type it in.";
const SKIP_CROP = 'Skip crop, read whole photo';

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

  // Waits for the photo to be ready: the crop step asks for the digit window.
  async takePhoto(photo: PhotoFile) {
    await this.pickPhoto(photo);
    await this.page.getByRole('group', { name: 'Mark the digit window' }).waitFor();
  }

  // Skips the crop step, so the whole photo is read, once the photo is ready or the app could not open it
  // (the photo's error, role="alert").
  async readWholePhoto() {
    const skipCrop = this.page.getByRole('button', { name: SKIP_CROP });

    await skipCrop.or(this.page.getByRole('alert')).waitFor();

    if (await skipCrop.isVisible()) await skipCrop.click();
  }

  // The photo is done with once OCR has filled the Reading field, found nothing or ran out of time, or the app could
  // not open the file (the photo's error, role="alert"). Poll it with expect.poll.
  async hasFinishedWithPhoto(): Promise<boolean> {
    const hasFilledField = (await this.readingField.inputValue()) !== '';
    const hasFoundNothing = await this.page.getByText(NOTHING_FOUND_STATUS).isVisible();
    const hasTimedOut = await this.page.getByText(READ_TIMED_OUT_STATUS).isVisible();
    const isPhotoRefused = await this.page.getByRole('alert').isVisible();

    return hasFilledField || hasFoundNothing || hasTimedOut || isPhotoRefused;
  }

  // A reading is always today's: there is no date to pick.
  async save(digits: string) {
    await this.readingField.fill(digits);
    await this.page.getByRole('button', { name: 'Save reading' }).click();
  }
}
