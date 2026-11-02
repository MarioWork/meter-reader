import { Navigate, type RouteObject } from 'react-router';
import RouteError from '@pages/Error/RouteError';
import { authMiddleware } from './authMiddleware';
import { authRoutes } from './featureRoutes/authRoutes';
import { itemRoutes } from './featureRoutes/itemRoutes';
import { readingRoutes } from './featureRoutes/readingRoutes';
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
    // Any 401 from a loader or an action, anywhere below, becomes a trip to the login page.
    middleware: [authMiddleware],
    children: [
      ...authRoutes,
      {
        // Every app page needs a signed-in browser: this layout's loader sends anyone else to setup or login.
        lazy: () => import('@application/layout/SignedInLayout/SignedInLayout.route'),
        children: [
          {
            index: true,
            element: <Navigate to={defaultRedirectRoute} />,
          },
          {
            path: BASE_ROUTES_PATHS.HOME,
            lazy: () => import('@pages/Home/Home.route'),
          },
          ...readingRoutes,
          ...itemRoutes,
        ],
      },
    ],
  },
];

export default routes;
