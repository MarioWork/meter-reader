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

export const READING_ROUTES_PATHS = {
  NEW: '/readings/new',
  delete: (readingId?: string) => (readingId ? `/readings/${readingId}/delete` : '/readings/:readingId/delete'),
};

export const ITEM_ROUTES_PATHS = {
  BASE: '/items',
};

export const defaultRedirectRoute = BASE_ROUTES_PATHS.HOME;
