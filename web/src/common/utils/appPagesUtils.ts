import { ChartColumnIcon, HouseIcon, SettingsIcon } from 'lucide-react';
import { BASE_ROUTES_PATHS, COSTS_ROUTES_PATHS, SETTINGS_ROUTES_PATHS } from '@application/routes/routesUtils';
import { thisYearCostsPath } from '@utils/historyFilterUtils';
import type { AppPageUtil } from '@app-types/utility';

const HOME_LABEL = 'Home';
const COSTS_LABEL = 'Costs';
const SETTINGS_LABEL = 'Settings';

// The app's main pages, in order, for the desktop sidebar and the phone's menu drawer alike. Costs opens on this year,
// so the list is built on each render rather than once.
export function appPages(): AppPageUtil[] {
  return [
    { label: HOME_LABEL, to: BASE_ROUTES_PATHS.HOME, basePath: BASE_ROUTES_PATHS.HOME, Icon: HouseIcon },
    { label: COSTS_LABEL, to: thisYearCostsPath(), basePath: COSTS_ROUTES_PATHS.BASE, Icon: ChartColumnIcon },
    { label: SETTINGS_LABEL, to: SETTINGS_ROUTES_PATHS.BASE, basePath: SETTINGS_ROUTES_PATHS.BASE, Icon: SettingsIcon },
  ];
}
