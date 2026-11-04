import type { Page } from '@playwright/test';
import type { ThemeUtil } from '@app-types/utility';
import { BASE_ROUTES_PATHS } from '../../src/application/routes/routesUtils';
import { chooseMenuItemWithKeyboard, THEME_LABELS } from './AppHeader.page';

type SidebarPageName = 'Home' | 'Costs' | 'Settings';

// The signed-in sidebar on a wide screen: the app name, Home, Costs and Settings, then Sign out and Theme, and the
// edge that collapses it.
export class AppSidebar {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get navigation() {
    return this.page.getByRole('navigation', { name: 'Main' });
  }

  pageLink(name: SidebarPageName) {
    return this.navigation.getByRole('link', { name });
  }

  get themeButton() {
    return this.navigation.getByRole('button', { name: 'Theme' });
  }

  get signOutButton() {
    return this.navigation.getByRole('button', { name: 'Sign out' });
  }

  get collapseButton() {
    return this.page.getByRole('button', { name: 'Collapse sidebar' });
  }

  get expandButton() {
    return this.page.getByRole('button', { name: 'Expand sidebar' });
  }

  // Every control in the sidebar a pointer can hit, the edge included (named for what it will do next).
  get targets() {
    return this.navigation
      .getByRole('link')
      .or(this.navigation.getByRole('button'))
      .or(this.collapseButton)
      .or(this.expandButton);
  }

  get menu() {
    return this.page.getByRole('menu');
  }

  themeItem(theme: ThemeUtil) {
    return this.menu.getByRole('menuitemradio', { name: THEME_LABELS[theme] });
  }

  async gotoHome() {
    await this.page.goto(BASE_ROUTES_PATHS.HOME);
  }

  async openPage(name: SidebarPageName) {
    await this.pageLink(name).click();
  }

  async collapseFromEdge() {
    await this.collapseButton.click();
  }

  async chooseThemeWithKeyboard(theme: ThemeUtil) {
    await chooseMenuItemWithKeyboard({
      page: this.page,
      trigger: this.themeButton,
      menu: this.menu,
      menuItems: this.menu.getByRole('menuitemradio'),
      item: this.themeItem(theme),
    });
  }

  async signOutWithKeyboard() {
    await this.signOutButton.focus();
    await this.page.keyboard.press('Enter');
  }

  // Ctrl B, or ⌘ B on a Mac.
  async toggleWithShortcut() {
    await this.page.keyboard.press('ControlOrMeta+b');
  }
}
