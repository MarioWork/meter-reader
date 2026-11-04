import { SidebarStartUtil, type LocalStorageStateUtil } from '@app-types/utility';
import { useLocalStorage } from '@hooks/useLocalStorage';

export const SIDEBAR_START_STORAGE_KEY = 'meter-reader-sidebar-start';

const SIDEBAR_STARTS = Object.values(SidebarStartUtil);

// Settings' choice of how the wide screen's sidebar opens, expanded unless changed. Kept on this device, like the
// theme.
export function useSidebarStart(): LocalStorageStateUtil<SidebarStartUtil> {
  return useLocalStorage({
    key: SIDEBAR_START_STORAGE_KEY,
    fallback: SidebarStartUtil.EXPANDED,
    values: SIDEBAR_STARTS,
  });
}
