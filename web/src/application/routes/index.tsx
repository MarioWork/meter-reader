import { Navigate, type RouteObject } from 'react-router';
import RouteError from '@pages/Error/RouteError';
import { authMiddleware } from './authMiddleware';
import { authRoutes } from './featureRoutes/authRoutes';
import { itemRoutes } from './featureRoutes/itemRoutes';
import { readingRoutes } from './featureRoutes/readingRoutes';
import { BASE_ROUTES_PATHS, READING_ROUTES_PATHS, ROUTE_IDS, defaultRedirectRoute } from './routesUtils';

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
        // Every app page needs a signed-in browser: this layout's loader sends anyone else to setup or login. Its mail
        // status is read by the pages below too, by this id.
        id: ROUTE_IDS.SIGNED_IN_LAYOUT,
        lazy: () => import('@application/layout/SignedInLayout/SignedInLayout.route'),
        children: [
          {
            index: true,
            element: <Navigate to={defaultRedirectRoute} />,
          },
          {
            path: BASE_ROUTES_PATHS.HOME,
            lazy: () => import('@pages/Home/Home.route'),
            children: [
              {
                // Over the history, which stays in place behind it.
                path: READING_ROUTES_PATHS.send(),
                lazy: () => import('@pages/Home/components/SendReadingModal/SendReadingModal.route'),
              },
            ],
          },
          ...readingRoutes,
          ...itemRoutes,
        ],
      },
    ],
  },
];

export default routes;
