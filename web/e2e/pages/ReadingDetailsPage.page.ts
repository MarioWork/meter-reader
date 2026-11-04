import type { Page } from '@playwright/test';
import { READING_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

// One reading's own page: its title, digits, photo and cards, and the way back to the history.
export class ReadingDetailsPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(readingId: number) {
    await this.page.goto(READING_ROUTES_PATHS.details(String(readingId)));
  }

  get title() {
    return this.page.getByRole('heading', { level: 1 });
  }

  get backLink() {
    return this.page.getByRole('main').getByRole('link', { name: 'Readings', exact: true });
  }

  digits(digits: string) {
    return this.page.getByRole('main').getByText(digits, { exact: true });
  }

  // A sent reading's one primary action.
  get resendAction() {
    return this.page.getByRole('link', { name: 'Resend', exact: true });
  }

  get photoButton() {
    return this.page.getByRole('button', { name: 'Open the photo full screen' });
  }

  fullScreenPhoto(readingDate: string) {
    return this.page.getByRole('dialog', { name: `Photo of the reading of ${readingDate}` });
  }

  card(name: string) {
    return this.page.getByRole('region', { name });
  }

  async goBackToReadings() {
    await this.backLink.click();
  }

  async openPhoto() {
    await this.photoButton.click();
  }

  async closeWithEscape() {
    await this.page.keyboard.press('Escape');
  }

  async moveFocusWithTab() {
    await this.page.keyboard.press('Tab');
  }

  // True when keyboard focus sits on something in the page behind the open full-screen photo. (Focus on the body is the
  // browser's own toolbar, which a native modal dialog lets Tab reach.)
  async isFocusBehindDialog() {
    return this.page.evaluate(() => {
      const focused = document.activeElement;
      const isInDialog = focused?.closest('dialog[open]') !== null;

      return focused !== document.body && !isInDialog;
    });
  }
}
