// @vitest-environment jsdom
import { ThemeUtil } from '@app-types/utility';
import indexHtml from '../../../index.html?raw';
import indexCss from '../../index.css?raw';
import { applyTheme, readStoredTheme, resolveTheme, storeTheme, THEME_COLOURS, THEME_STORAGE_KEY } from './themeUtils';

const LIGHT_META_MEDIA = '(prefers-color-scheme: light)';
const DARK_META_MEDIA = '(prefers-color-scheme: dark)';

function addThemeColourMeta(media: string) {
  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  meta.media = media;
  document.head.append(meta);

  return meta;
}

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.className = '';
  document.head.innerHTML = '';
});

describe('THEME_COLOURS', () => {
  it('matches the page background of each theme in index.css', () => {
    const lightBackground = /^:root \{[^}]*--background: (#\w+);/m.exec(indexCss)?.[1];
    const darkBackground = /^\.dark \{[^}]*--background: (#\w+);/m.exec(indexCss)?.[1];

    expect(THEME_COLOURS).toEqual({ [ThemeUtil.LIGHT]: lightBackground, [ThemeUtil.DARK]: darkBackground });
  });

  it("matches index.html's theme-color tags, which show before the app loads", () => {
    const metaColours = [...indexHtml.matchAll(/name="theme-color" content="(#\w+)"/g)].map((match) => match[1]);

    expect(metaColours).toEqual([THEME_COLOURS[ThemeUtil.LIGHT], THEME_COLOURS[ThemeUtil.DARK]]);
  });
});

describe('readStoredTheme', () => {
  it('follows the device when nothing is stored', () => {
    expect(readStoredTheme()).toBe(ThemeUtil.SYSTEM);
  });

  it('returns the stored choice', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, ThemeUtil.DARK);

    expect(readStoredTheme()).toBe(ThemeUtil.DARK);
  });

  it('follows the device when the stored value is not a theme', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'purple');

    expect(readStoredTheme()).toBe(ThemeUtil.SYSTEM);
  });

  it('follows the device when the browser blocks storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });

    expect(readStoredTheme()).toBe(ThemeUtil.SYSTEM);
  });
});

describe('storeTheme', () => {
  it('keeps the choice for the next visit', () => {
    storeTheme(ThemeUtil.LIGHT);

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(ThemeUtil.LIGHT);
  });

  it('does not throw when the browser blocks storage', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Full', 'QuotaExceededError');
    });

    expect(() => storeTheme(ThemeUtil.DARK)).not.toThrow();
  });
});

describe('resolveTheme', () => {
  it.each([
    { theme: ThemeUtil.SYSTEM, prefersDark: true, applied: ThemeUtil.DARK },
    { theme: ThemeUtil.SYSTEM, prefersDark: false, applied: ThemeUtil.LIGHT },
    { theme: ThemeUtil.LIGHT, prefersDark: true, applied: ThemeUtil.LIGHT },
    { theme: ThemeUtil.DARK, prefersDark: false, applied: ThemeUtil.DARK },
  ])('$theme on a device that prefers dark: $prefersDark is $applied', ({ theme, prefersDark, applied }) => {
    expect(resolveTheme(theme, prefersDark)).toBe(applied);
  });
});

describe('applyTheme', () => {
  it('puts the dark class on the page for the dark theme and takes it off for the light one', () => {
    applyTheme(ThemeUtil.DARK);
    expect(document.documentElement).toHaveClass('dark');

    applyTheme(ThemeUtil.LIGHT);
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it("sets the browser's theme colour to the applied theme, whatever the device prefers", () => {
    const lightMeta = addThemeColourMeta(LIGHT_META_MEDIA);
    const darkMeta = addThemeColourMeta(DARK_META_MEDIA);

    applyTheme(ThemeUtil.DARK);

    expect(lightMeta.content).toBe(THEME_COLOURS.dark);
    expect(darkMeta.content).toBe(THEME_COLOURS.dark);
  });
});
