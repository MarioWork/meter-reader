import type { RouteObject } from 'react-router';
import { READING_ROUTES_PATHS } from '../routesUtils';

export const readingRoutes: RouteObject[] = [
  {
    path: READING_ROUTES_PATHS.NEW,
    lazy: () => import('@pages/NewReading/NewReading.route'),
  },
  {
    // Action only: the history's confirm dialog submits here, then Home's loader runs again.
    path: READING_ROUTES_PATHS.delete(),
    lazy: { action: async () => (await import('@pages/Home/homeActions')).deleteReadingAction },
  },
];
