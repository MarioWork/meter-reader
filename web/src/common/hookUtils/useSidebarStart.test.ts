// @vitest-environment jsdom
import { SidebarStartUtil } from '@app-types/utility';
import { act, renderHook } from '@test-utils';
import { SIDEBAR_START_STORAGE_KEY, useSidebarStart } from './useSidebarStart';

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

it('starts expanded when nothing is saved on this device', () => {
  const { result } = renderHook(useSidebarStart);

  const [sidebarStart] = result.current;

  expect(sidebarStart).toBe(SidebarStartUtil.EXPANDED);
});

it('reads the choice saved on this device', () => {
  window.localStorage.setItem(SIDEBAR_START_STORAGE_KEY, SidebarStartUtil.COLLAPSED);

  const { result } = renderHook(useSidebarStart);

  expect(result.current[0]).toBe(SidebarStartUtil.COLLAPSED);
});

it('saves a new choice and gives it back at once', () => {
  const { result } = renderHook(useSidebarStart);

  act(() => result.current[1](SidebarStartUtil.COLLAPSED));

  expect(result.current[0]).toBe(SidebarStartUtil.COLLAPSED);
  expect(window.localStorage.getItem(SIDEBAR_START_STORAGE_KEY)).toBe(SidebarStartUtil.COLLAPSED);
});

it('ignores a stored value that is not a choice', () => {
  window.localStorage.setItem(SIDEBAR_START_STORAGE_KEY, 'sideways');

  const { result } = renderHook(useSidebarStart);

  expect(result.current[0]).toBe(SidebarStartUtil.EXPANDED);
});

it('falls back to expanded when storage is blocked', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });

  const { result } = renderHook(useSidebarStart);

  expect(result.current[0]).toBe(SidebarStartUtil.EXPANDED);
  expect(() => act(() => result.current[1](SidebarStartUtil.COLLAPSED))).not.toThrow();
});
