import type { Page } from '@playwright/test';
import { SETTINGS_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

type SidebarStartLabel = 'Expanded' | 'Collapsed';

// Settings: the Email addresses and Message cards, the live Preview card, the save bar, then the Appearance and Data
// cards below them.
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

  get appearance() {
    return this.page.getByRole('region', { name: 'Appearance' });
  }

  sidebarStartChoice(label: SidebarStartLabel) {
    return this.appearance.getByRole('group', { name: 'Sidebar starts' }).getByRole('button', { name: label });
  }

  async chooseSidebarStart(label: SidebarStartLabel) {
    await this.sidebarStartChoice(label).click();
  }

  async reload() {
    await this.page.reload();
  }

  async goto() {
    await this.page.goto(SETTINGS_ROUTES_PATHS.BASE);
  }

  // Into the body template, then down to the end of the form (its Save bar at the bottom of the window), as when
  // editing on a short window. The Appearance and Data cards below the form are not part of the editing.
  async editBodyTemplateScrolledDown() {
    await this.bodyTemplateField.click();
    await this.saveButton.evaluate((saveButton) => saveButton.scrollIntoView({ block: 'end' }));
  }
}
