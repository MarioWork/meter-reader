import type { Page } from '@playwright/test';
import { READING_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

export class NewReadingPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto(READING_ROUTES_PATHS.NEW);
  }

  async save(digits: string, date: string) {
    await this.page.getByRole('textbox', { name: 'Reading' }).fill(digits);
    await this.page.getByLabel('Date').fill(date);
    await this.page.getByRole('button', { name: 'Save reading' }).click();
  }
}
