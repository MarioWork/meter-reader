import type { RouteObject } from 'react-router';
import { ITEM_ROUTES_PATHS } from '../routesUtils';

export const itemRoutes: RouteObject[] = [
  {
    path: ITEM_ROUTES_PATHS.BASE,
    lazy: () => import('@pages/ItemList/ItemList.route'),
  },
];
