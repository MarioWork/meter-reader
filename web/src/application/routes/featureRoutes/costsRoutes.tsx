import type { RouteObject } from 'react-router';
import { COSTS_ROUTES_PATHS } from '../routesUtils';

export const costsRoutes: RouteObject[] = [
  {
    path: COSTS_ROUTES_PATHS.BASE,
    lazy: () => import('@pages/Costs/Costs.route'),
  },
];
