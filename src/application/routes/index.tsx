import { Navigate, type RouteObject } from 'react-router';
import RouteError from '@pages/Error/RouteError';
import { itemRoutes } from './featureRoutes/itemRoutes';
import { BASE_ROUTES_PATHS, defaultRedirectRoute } from './routesUtils';

const routes: RouteObject[] = [
  {
    path: BASE_ROUTES_PATHS.ROOT,
    errorElement: <RouteError />,
    // Shown while the first page's lazy module and loader resolve on the initial load.
    hydrateFallbackElement: (
      <p role="status" className="p-6">
        Loading…
      </p>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={defaultRedirectRoute} />,
      },
      {
        path: BASE_ROUTES_PATHS.HOME,
        lazy: () => import('@pages/Home/Home.route'),
      },
      ...itemRoutes,
    ],
  },
];

export default routes;
