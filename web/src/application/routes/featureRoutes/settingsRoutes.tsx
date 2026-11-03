import type { RouteObject } from 'react-router';
import { SETTINGS_ROUTES_PATHS } from '../routesUtils';

export const settingsRoutes: RouteObject[] = [
  {
    path: SETTINGS_ROUTES_PATHS.BASE,
    lazy: () => import('@pages/Settings/Settings.route'),
  },
];
