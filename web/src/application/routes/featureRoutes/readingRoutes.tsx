import type { RouteObject } from 'react-router';
import { READING_ROUTES_PATHS } from '../routesUtils';

export const readingRoutes: RouteObject[] = [
  {
    path: READING_ROUTES_PATHS.NEW,
    lazy: () => import('@pages/NewReading/NewReading.route'),
  },
  {
    // One reading's own page, opened from its card or its row in the history. Its "⋯" menu deletes it through the
    // page's own action, which goes back to Home.
    path: READING_ROUTES_PATHS.details(),
    lazy: () => import('@pages/ReadingDetails/ReadingDetails.route'),
    children: [
      {
        // Over the reading's page, which it goes back to once sent or closed.
        path: READING_ROUTES_PATHS.detailsSend(),
        lazy: () => import('@components/SendReadingModal/SendReadingModal.route'),
      },
      {
        // Over the reading's page, which it goes back to once saved or closed.
        path: READING_ROUTES_PATHS.detailsCostAndBill(),
        lazy: () => import('@components/CostAndBillModal/CostAndBillModal.route'),
      },
    ],
  },
  {
    // Loader only: an old link to the details modal over Home goes to the reading's page, with Home's search.
    path: READING_ROUTES_PATHS.detailsModal(),
    lazy: { loader: async () => (await import('@pages/ReadingDetails/detailsModalRedirectLoader')).loader },
  },
  {
    // Action only: the history's confirm dialog submits here, then Home's loader runs again.
    path: READING_ROUTES_PATHS.delete(),
    lazy: { action: async () => (await import('@pages/Home/homeActions')).deleteReadingAction },
  },
];
