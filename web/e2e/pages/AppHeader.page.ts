import type { Locator, Page } from '@playwright/test';
import { ThemeUtil } from '@app-types/utility';
import { BASE_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

// Each theme's name in the menu.
const THEME_LABELS: Record<ThemeUtil, string> = {
  [ThemeUtil.LIGHT]: 'Light',
  [ThemeUtil.DARK]: 'Dark',
  [ThemeUtil.SYSTEM]: 'System',
};

// The signed-in header on every page: the logo, the app name, and the menu with the theme and Sign out.
export class AppHeader {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get banner() {
    return this.page.getByRole('banner');
  }

  get menuButton() {
    return this.banner.getByRole('button', { name: 'Menu' });
  }

  get menu() {
    return this.page.getByRole('menu');
  }

  get menuItems() {
    return this.menu.getByRole('menuitem').or(this.menu.getByRole('menuitemradio'));
  }

  themeItem(theme: ThemeUtil) {
    return this.menu.getByRole('menuitemradio', { name: THEME_LABELS[theme] });
  }

  get signOutItem() {
    return this.menu.getByRole('menuitem', { name: 'Sign out' });
  }

  async gotoHome() {
    await this.page.goto(BASE_ROUTES_PATHS.HOME);
  }

  async tapMenuButton() {
    await this.menuButton.tap();
  }

  async tapThemeItem(theme: ThemeUtil) {
    await this.themeItem(theme).tap();
  }

  async tapSignOut() {
    await this.signOutItem.tap();
  }

  // Keyboard only: focus the menu button, open the menu with Enter, arrow down to the item, press Enter.
  async chooseWithKeyboard(item: Locator) {
    await this.menuButton.focus();
    await this.page.keyboard.press('Enter');
    await this.menu.waitFor();

    // One press per item reaches any of them.
    const itemCount = await this.menuItems.count();

    for (let i = 0; i < itemCount; i++) {
      const isItemFocused = await item.evaluate((element) => element === document.activeElement);

      if (isItemFocused) break;

      await this.page.keyboard.press('ArrowDown');
    }

    await this.page.keyboard.press('Enter');
  }

  async chooseThemeWithKeyboard(theme: ThemeUtil) {
    await this.chooseWithKeyboard(this.themeItem(theme));
  }

  async signOutWithKeyboard() {
    await this.chooseWithKeyboard(this.signOutItem);
  }

  // Scrolls the page so the focused element's top sits this many px into the viewport: under the sticky header, unless
  // the page keeps it clear.
  async scrollFocusedElementTo(offsetPx: number) {
    await this.focusedElement.evaluate((element, offset) => {
      const elementTop = element.getBoundingClientRect().top + window.scrollY;

      window.scrollTo(0, elementTop - offset);
    }, offsetPx);
  }

  // From the menu button, Tab moves on to the first control in the page below the header.
  async tabPastHeader() {
    await this.menuButton.focus();
    await this.page.keyboard.press('Tab');
  }

  // A CSS selector on purpose: "whatever has focus" has no role or name to query by.
  get focusedElement() {
    return this.page.locator(':focus');
  }
}
