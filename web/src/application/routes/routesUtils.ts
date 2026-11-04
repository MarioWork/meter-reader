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

// The history's filters, named as the API names them: a day range (both ends inclusive, YYYY-MM-DD) and the
// statuses to show, comma-separated. Home and Costs both keep them in the url; Costs has the day range only.
export const HISTORY_FILTER_SEARCH_PARAMS = {
  DATE_FROM: 'from',
  DATE_TO: 'to',
  STATUSES: 'status',
};

export const HOME_SEARCH_PARAMS = {
  // How many pages of the history are shown: ?pages=3 shows the first three. Not the API's `page`, which is one page.
  SHOWN_PAGES: 'pages',
  ...HISTORY_FILTER_SEARCH_PARAMS,
};

export const READING_ROUTES_PATHS = {
  // A phone gets New reading as its own page; a wider screen gets it as a routed modal over the history.
  NEW: '/readings/new',
  NEW_MODAL: `${BASE_ROUTES_PATHS.HOME}/readings/new`,
  delete: (readingId?: string) => (readingId ? `/readings/${readingId}/delete` : '/readings/:readingId/delete'),
  // One reading's own page: everything about it. It carries Home's search, so "← Readings" goes back to the same
  // filters and page of the history.
  details: (readingId?: string) => `/readings/${readingId ?? ':readingId'}`,
  // Where the details were a modal over the history, before they had a page: an old link there redirects to it.
  detailsModal: (readingId?: string) => `${BASE_ROUTES_PATHS.HOME}/readings/${readingId ?? ':readingId'}`,
  // A routed modal over the history: the email preview, and the send.
  send: (readingId?: string) => `${BASE_ROUTES_PATHS.HOME}/readings/${readingId ?? ':readingId'}/send`,
  // A routed modal over the history: what the reading cost, added after it is saved.
  costAndBill: (readingId?: string) => `${BASE_ROUTES_PATHS.HOME}/readings/${readingId ?? ':readingId'}/cost-and-bill`,
  // The same two modals over the reading's own page.
  detailsSend: (readingId?: string) => `${READING_ROUTES_PATHS.details(readingId)}/send`,
  detailsCostAndBill: (readingId?: string) => `${READING_ROUTES_PATHS.details(readingId)}/cost-and-bill`,
};

// What the readings cost, over time, narrowed by the same day range as Home's history.
export const COSTS_ROUTES_PATHS = {
  BASE: '/costs',
};

// Loader only, never a page: the bill viewer reads one bill through it, with a fetcher, wherever a bill shows.
export const BILL_ROUTES_PATHS = {
  view: (billId?: string) => `/bills/${billId ?? ':billId'}`,
};

export const SETTINGS_ROUTES_PATHS = {
  BASE: '/settings',
};

// Routes whose loader data other routes read with useRouteLoaderData.
export const ROUTE_IDS = {
  SIGNED_IN_LAYOUT: 'signedInLayout',
};

export const defaultRedirectRoute = BASE_ROUTES_PATHS.HOME;
