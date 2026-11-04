import { BASE_ROUTES_PATHS, READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import { withSearchOf } from './urlSearchUtils';

// A reading's send preview and its cost & bill dialog open over Home's history or over the reading's own page. Closed
// or done, each goes back to the page it opened over, which its own path says: Home's modals sit under /home.
export function pageBehindReadingModal(modalPathname: string, readingId: string): string {
  const isOverHome = modalPathname.startsWith(`${BASE_ROUTES_PATHS.HOME}/`);

  if (isOverHome) return BASE_ROUTES_PATHS.HOME;

  return READING_ROUTES_PATHS.details(readingId);
}

// The same page as a full url path, with the search the modal carries: Home's filters and pages of the history.
export function redirectBehindReadingModal(requestUrl: string, readingId: number): string {
  const { pathname } = new URL(requestUrl);

  return withSearchOf(requestUrl, pageBehindReadingModal(pathname, String(readingId)));
}
