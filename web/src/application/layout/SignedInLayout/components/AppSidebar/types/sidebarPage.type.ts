import type { LucideIcon } from 'lucide-react';

export type SidebarPage = {
  label: string;
  // Where the link goes.
  to: string;
  // The page's own path: the link is the current page anywhere below it (Home's modals included).
  basePath: string;
  Icon: LucideIcon;
};
