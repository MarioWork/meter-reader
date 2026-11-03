import type { Page } from '@playwright/test';
import { BASE_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

const DELETE_DIALOG_NAME = 'Delete this reading?';
const SEND_DIALOG_NAME = 'Send this reading?';
const FILTER_SHEET_NAME = 'Filter readings';

export class HomePage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get main() {
    return this.page.getByRole('main');
  }

  get lastReadingCard() {
    return this.page.getByRole('region', { name: 'Last reading' });
  }

  get earlierReadings() {
    return this.page.getByRole('region', { name: 'Earlier readings' });
  }

  get earlierCards() {
    return this.earlierReadings.getByRole('listitem');
  }

  // A wide screen's history: the region around the table, focused once a send or a delete took focus away.
  get readingHistory() {
    return this.page.getByRole('region', { name: 'Readings' });
  }

  // Every row of the wide screen's table but its header row, newest first.
  get readingRows() {
    return this.page
      .getByRole('table', { name: 'Readings' })
      .getByRole('row')
      .filter({ has: this.page.getByRole('cell') });
  }

  // A reading's row, by its details link, named after the day it shows.
  rowFor(readingDate: string) {
    const detailsLink = this.page.getByRole('link', { name: `${readingDate} reading details`, exact: true });

    return this.readingRows.filter({ has: detailsLink });
  }

  get matchingCards() {
    return this.page.getByRole('region', { name: 'Matching readings' }).getByRole('listitem');
  }

  get filterButton() {
    return this.page.getByRole('button', { name: 'Filter' });
  }

  get filterSheet() {
    return this.page.getByRole('dialog', { name: FILTER_SHEET_NAME });
  }

  get noMatchesHeading() {
    return this.page.getByRole('heading', { name: 'No readings match these filters' });
  }

  get activeFilters() {
    return this.page.getByRole('list', { name: 'Active filters' }).getByRole('button');
  }

  get historyCount() {
    return this.page.getByText(/^Showing \d+ of \d+ readings$/);
  }

  get loadMoreButton() {
    return this.page.getByRole('button', { name: 'Load more' });
  }

  get newReadingLink() {
    return this.page.getByRole('link', { name: 'New reading' });
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
    return this.page.getByRole('dialog', { name: SEND_DIALOG_NAME });
  }

  get sendDialogCloseButton() {
    return this.sendDialog.getByRole('button', { name: 'Close' });
  }

  get sendDialogSendButton() {
    return this.sendDialog.getByRole('button', { name: 'Send' });
  }

  get attachPhotoSwitch() {
    return this.sendDialog.getByRole('switch', { name: 'Attach photo' });
  }

  get deleteMenuItem() {
    return this.page.getByRole('menuitem', { name: 'Delete' });
  }

  // A toast, named by its title, inside the polite live region screen readers announce.
  notification(title: string) {
    return this.page.getByRole('region', { name: 'Notifications' }).getByRole('dialog', { name: title });
  }

  photoDialog(title: string) {
    return this.page.getByRole('dialog', { name: title });
  }

  sendLinkFor(readingDate: string) {
    return this.page.getByRole('link', { name: `Send the reading of ${readingDate}` });
  }

  menuButtonFor(readingDate: string) {
    return this.page.getByRole('button', { name: `More actions for the reading of ${readingDate}` });
  }

  async goto() {
    await this.page.goto(BASE_ROUTES_PATHS.HOME);
  }

  // Opens the filter sheet, presses each choice (a date preset, a status) and applies them.
  async filterBy(choices: string[]) {
    await this.filterButton.click();

    for (const choice of choices) {
      await this.filterSheet.getByRole('button', { name: choice, exact: true }).click();
    }

    await this.filterSheet.getByRole('button', { name: 'Show readings' }).click();
  }

  async removeFilter(label: string) {
    await this.page.getByRole('button', { name: `Remove filter: ${label}` }).click();
  }

  async clearFilters() {
    await this.page.getByRole('button', { name: 'Clear filters' }).click();
  }

  async goBack() {
    await this.page.goBack();
  }

  async reload() {
    await this.page.reload();
  }

  // Scrolls the end of the history into view, as a thumb would.
  async scrollToEndOfHistory() {
    await this.loadMoreButton.scrollIntoViewIfNeeded();
  }

  // Keyboard only: focus the reading's "⋯" button, open its menu with Enter, go to its last item (Delete) and press
  // Enter.
  async openDeleteDialogWithKeyboard(readingDate: string) {
    await this.menuButtonFor(readingDate).focus();
    await this.page.keyboard.press('Enter');
    await this.deleteMenuItem.waitFor();
    await this.page.keyboard.press('End');
    await this.page.keyboard.press('Enter');
  }

  async openPhoto(readingDate: string) {
    await this.menuButtonFor(readingDate).click();
    await this.page.getByRole('menuitem', { name: 'View photo' }).click();
  }

  async closePhoto(title: string) {
    await this.photoDialog(title).getByRole('button', { name: 'Close' }).click();
  }

  async openSendPreview(readingDate: string) {
    await this.sendLinkFor(readingDate).click();
  }

  async sendFromPreview() {
    await this.sendDialogSendButton.click();
  }

  async closePreview() {
    await this.sendDialogCloseButton.click();
  }

  // Keyboard only: focus the reading's Send link and press Enter.
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

  // True when the send preview sits on the bottom edge of the screen, as a bottom sheet does.
  async isSendSheetAtBottom() {
    const sheetBox = await this.sendDialog.boundingBox();
    const viewport = this.page.viewportSize();

    if (!sheetBox || !viewport) return false;

    return Math.round(sheetBox.y + sheetBox.height) === viewport.height;
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
