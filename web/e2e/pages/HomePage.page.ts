import type { Page } from '@playwright/test';
import { BASE_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

const DELETE_DIALOG_NAME = 'Delete this reading?';
const SEND_DIALOG_NAME = 'Send this reading?';

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
    return this.page.getByRole('alertdialog', { name: DELETE_DIALOG_NAME });
  }

  get dialogCancelButton() {
    return this.deleteDialog.getByRole('button', { name: 'Cancel' });
  }

  get dialogDeleteButton() {
    return this.deleteDialog.getByRole('button', { name: 'Delete' });
  }

  get sendDialog() {
    return this.page.getByRole('alertdialog', { name: SEND_DIALOG_NAME });
  }

  get sendDialogSendButton() {
    return this.sendDialog.getByRole('button', { name: 'Send' });
  }

  get attachPhotoCheckbox() {
    return this.sendDialog.getByRole('checkbox', { name: 'Attach photo' });
  }

  // A toast, named by its title, inside the polite live region screen readers announce.
  notification(title: string) {
    return this.page.getByRole('region', { name: 'Notifications' }).getByRole('dialog', { name: title });
  }

  sendLinkFor(readingDate: string) {
    return this.page.getByRole('link', { name: `Send the reading of ${readingDate}` });
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

  async openSendPreview(readingDate: string) {
    await this.sendLinkFor(readingDate).click();
  }

  async sendFromPreview() {
    await this.sendDialogSendButton.click();
  }

  // Keyboard only: focus the row's Send link and press Enter.
  async openSendPreviewWithKeyboard(readingDate: string) {
    await this.sendLinkFor(readingDate).focus();
    await this.page.keyboard.press('Enter');
  }

  async moveFocusWithTab() {
    await this.page.keyboard.press('Tab');
  }

  async pressFocusedButton() {
    await this.page.keyboard.press('Enter');
  }

  async cancelWithEscape() {
    await this.page.keyboard.press('Escape');
  }

  // True when keyboard focus sits on something in the page behind the open dialog.
  async isFocusBehindDialog() {
    return this.page.evaluate(() => {
      const focused = document.activeElement;
      const isInDialog = focused?.closest('[role="alertdialog"]') !== null;

      return focused !== document.body && !isInDialog;
    });
  }
}
