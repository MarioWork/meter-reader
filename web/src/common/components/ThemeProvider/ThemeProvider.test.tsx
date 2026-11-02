import { act, renderHook } from '@test-utils';
import { ThemeUtil } from '@app-types/utility';
import { useTheme } from '@hooks/useTheme';
import { THEME_STORAGE_KEY } from '@utils/themeUtils';

type DeviceScheme = {
  switchTo: (prefersDark: boolean) => void;
};

// The device's light or dark setting, switchable mid-test, as the OS setting would be.
function fakeDeviceScheme(prefersDark: boolean): DeviceScheme {
  const listeners = new Set<() => void>();
  let isDark = prefersDark;

  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        get matches() {
          return isDark;
        },
        media: query,
        addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
        removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
      }) as unknown as MediaQueryList,
  );

  return {
    switchTo: (nextIsDark) => {
      isDark = nextIsDark;
      listeners.forEach((listener) => listener());
    },
  };
}

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.className = '';
});

it('follows the device when the user has not picked a theme', () => {
  fakeDeviceScheme(true);

  const { result } = renderHook(useTheme);

  expect(result.current.theme).toBe(ThemeUtil.SYSTEM);
  expect(result.current.appliedTheme).toBe(ThemeUtil.DARK);
  expect(document.documentElement).toHaveClass('dark');
});

it('switches when the device switches', () => {
  const deviceScheme = fakeDeviceScheme(false);
  const { result } = renderHook(useTheme);

  act(() => deviceScheme.switchTo(true));

  expect(result.current.appliedTheme).toBe(ThemeUtil.DARK);
  expect(document.documentElement).toHaveClass('dark');
});

it('keeps the stored choice over the device setting', () => {
  fakeDeviceScheme(false);
  window.localStorage.setItem(THEME_STORAGE_KEY, ThemeUtil.DARK);

  const { result } = renderHook(useTheme);

  expect(result.current.theme).toBe(ThemeUtil.DARK);
  expect(document.documentElement).toHaveClass('dark');
});

it('applies and remembers a theme the user picks', () => {
  fakeDeviceScheme(true);
  const { result } = renderHook(useTheme);

  act(() => result.current.setTheme(ThemeUtil.LIGHT));

  expect(result.current.appliedTheme).toBe(ThemeUtil.LIGHT);
  expect(document.documentElement).not.toHaveClass('dark');
  expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(ThemeUtil.LIGHT);
});
