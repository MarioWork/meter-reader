// How the wide screen's sidebar opens when the app loads: wide with its labels (the default), or icons only.
export const SidebarStartUtil = {
  EXPANDED: 'expanded',
  COLLAPSED: 'collapsed',
} as const;

export type SidebarStartUtil = (typeof SidebarStartUtil)[keyof typeof SidebarStartUtil];
