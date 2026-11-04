import type { LucideIcon } from 'lucide-react';

// One of the app's main pages, as the desktop sidebar and the phone's menu drawer both list them.
export type AppPageUtil = {
  label: string;
  // Where the link goes.
  to: string;
  // The page's own path: the link is the current page anywhere below it (Home's modals included).
  basePath: string;
  Icon: LucideIcon;
};
