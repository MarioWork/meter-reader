export const BASE_ROUTES_PATHS = {
  ROOT: '/',
  HOME: '/home',
};

export const AUTH_ROUTES_PATHS = {
  LOGIN: '/login',
  // The server prints the setup link as /setup?code=<one-time code> (ADR 0002).
  SETUP: '/setup',
  LOGOUT: '/logout',
};

export const AUTH_SEARCH_PARAMS = {
  SETUP_CODE: 'code',
};

export const HOME_SEARCH_PARAMS = {
  // How many pages of the history are shown: ?pages=3 shows the first three. Not the API's `page`, which is one page.
  SHOWN_PAGES: 'pages',
  // The history's filters, named as the API names them: a day range (both ends inclusive, YYYY-MM-DD) and the
  // statuses to show, comma-separated.
  DATE_FROM: 'from',
  DATE_TO: 'to',
  STATUSES: 'status',
};

export const READING_ROUTES_PATHS = {
  // A phone gets New reading as its own page; a wider screen gets it as a routed modal over the history.
  NEW: '/readings/new',
  NEW_MODAL: `${BASE_ROUTES_PATHS.HOME}/readings/new`,
  delete: (readingId?: string) => (readingId ? `/readings/${readingId}/delete` : '/readings/:readingId/delete'),
  // A routed modal over the history: everything about one reading.
  details: (readingId?: string) => `${BASE_ROUTES_PATHS.HOME}/readings/${readingId ?? ':readingId'}`,
  // A routed modal over the history: the email preview, and the send.
  send: (readingId?: string) => `${BASE_ROUTES_PATHS.HOME}/readings/${readingId ?? ':readingId'}/send`,
  // A routed modal over the history: what the reading cost, added after it is saved.
  costAndBill: (readingId?: string) => `${BASE_ROUTES_PATHS.HOME}/readings/${readingId ?? ':readingId'}/cost-and-bill`,
};

export const SETTINGS_ROUTES_PATHS = {
  BASE: '/settings',
};

// Routes whose loader data other routes read with useRouteLoaderData.
export const ROUTE_IDS = {
  SIGNED_IN_LAYOUT: 'signedInLayout',
};

export const defaultRedirectRoute = BASE_ROUTES_PATHS.HOME;
