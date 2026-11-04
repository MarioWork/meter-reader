import type { Page } from '@playwright/test';
import { SETTINGS_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

// Settings: the Email addresses and Message cards, the live Preview card, the save bar, and the Data card below them.
export class SettingsPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get heading() {
    return this.page.getByRole('heading', { level: 1, name: 'Settings' });
  }

  get emailAddressesCard() {
    return this.page.getByRole('region', { name: 'Email addresses' });
  }

  get messageCard() {
    return this.page.getByRole('region', { name: 'Message' });
  }

  get bodyTemplateField() {
    return this.page.getByRole('textbox', { name: 'Body template' });
  }

  get preview() {
    return this.page.getByRole('region', { name: 'Preview' });
  }

  get saveButton() {
    return this.page.getByRole('button', { name: 'Save' });
  }

  get dataBackup() {
    return this.page.getByRole('region', { name: 'Data' });
  }

  async goto() {
    await this.page.goto(SETTINGS_ROUTES_PATHS.BASE);
  }

  // Into the body template, then down to the bottom of the page, as when editing on a short window.
  async editBodyTemplateScrolledDown() {
    await this.bodyTemplateField.click();
    await this.page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  }
}
