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
};

export const READING_ROUTES_PATHS = {
  NEW: '/readings/new',
  delete: (readingId?: string) => (readingId ? `/readings/${readingId}/delete` : '/readings/:readingId/delete'),
  // A routed modal over the history: the email preview, and the send.
  send: (readingId?: string) => `${BASE_ROUTES_PATHS.HOME}/readings/${readingId ?? ':readingId'}/send`,
};

// Routes whose loader data other routes read with useRouteLoaderData.
export const ROUTE_IDS = {
  SIGNED_IN_LAYOUT: 'signedInLayout',
};

export const defaultRedirectRoute = BASE_ROUTES_PATHS.HOME;
