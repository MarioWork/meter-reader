import type { RouteObject } from 'react-router';
import { READING_ROUTES_PATHS } from '../routesUtils';

export const readingRoutes: RouteObject[] = [
  {
    path: READING_ROUTES_PATHS.NEW,
    lazy: () => import('@pages/NewReading/NewReading.route'),
  },
];
