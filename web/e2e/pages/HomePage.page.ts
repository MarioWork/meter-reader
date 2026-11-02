import type { Page } from '@playwright/test';
import { BASE_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

const DELETE_DIALOG_NAME = 'Delete this reading?';

export class HomePage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get historyTable() {
    return this.page.getByRole('table', { name: 'History' });
  }

  get historyRows() {
    // The header row is the first one.
    return this.historyTable.getByRole('row');
  }

  get deleteDialog() {
    return this.page.getByRole('dialog', { name: DELETE_DIALOG_NAME });
  }

  deleteButtonFor(readingDate: string) {
    return this.page.getByRole('button', { name: `Delete the reading of ${readingDate}` });
  }

  async goto() {
    await this.page.goto(BASE_ROUTES_PATHS.HOME);
  }

  // Keyboard only: focus the row's Delete control and press Enter.
  async openDeleteDialogWithKeyboard(readingDate: string) {
    await this.deleteButtonFor(readingDate).focus();
    await this.page.keyboard.press('Enter');
  }

  async pressKey(key: string) {
    await this.page.keyboard.press(key);
  }
}
