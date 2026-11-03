import type { RouteObject } from 'react-router';
import { BILL_ROUTES_PATHS } from '../routesUtils';

export const billRoutes: RouteObject[] = [
  {
    // Loader only: the bill viewer loads a bill through it with a fetcher, over the page it opens on.
    path: BILL_ROUTES_PATHS.view(),
    lazy: { loader: async () => (await import('@components/BillButton/billViewerLoader')).loader },
    // Loaded once per opening, not again after every write on the page: that would fetch the whole file again. Not
    // lazy, so the router has it before the first write after an opening.
    shouldRevalidate: () => false,
  },
];
