import { ChartColumnIcon, HouseIcon, SettingsIcon } from 'lucide-react';
import { BASE_ROUTES_PATHS, COSTS_ROUTES_PATHS, SETTINGS_ROUTES_PATHS } from '@application/routes/routesUtils';
import { thisYearCostsPath } from '@utils/historyFilterUtils';
import type { SidebarPage } from './types';

const HOME_LABEL = 'Home';
const COSTS_LABEL = 'Costs';
const SETTINGS_LABEL = 'Settings';

// The sidebar's pages, in order. Costs opens on this year, as the phone's menu link does, so the list is built on
// each render rather than once.
export function sidebarPages(): SidebarPage[] {
  return [
    { label: HOME_LABEL, to: BASE_ROUTES_PATHS.HOME, basePath: BASE_ROUTES_PATHS.HOME, Icon: HouseIcon },
    { label: COSTS_LABEL, to: thisYearCostsPath(), basePath: COSTS_ROUTES_PATHS.BASE, Icon: ChartColumnIcon },
    { label: SETTINGS_LABEL, to: SETTINGS_ROUTES_PATHS.BASE, basePath: SETTINGS_ROUTES_PATHS.BASE, Icon: SettingsIcon },
  ];
}
