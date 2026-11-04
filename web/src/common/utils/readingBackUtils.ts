import { matchPath, type To } from 'react-router';
import { BASE_ROUTES_PATHS, COSTS_ROUTES_PATHS } from '@application/routes/routesUtils';

// Which list a reading's page was opened from, kept in its search so it rides along through Previous, Next and the
// routed modals as the list's own filters do. Left out, it is Home.
// Not `from`: the lists' day range already uses `from` and `to` (HISTORY_FILTER_SEARCH_PARAMS).
const CAME_FROM_PARAM = 'back';
const CAME_FROM_COSTS = 'costs';

export type BackPage = { to: To; label: string; iconLabel: string };

const HOME_BACK = { pathname: BASE_ROUTES_PATHS.HOME, label: 'Readings', iconLabel: 'Back to readings' };
const COSTS_BACK = { pathname: COSTS_ROUTES_PATHS.BASE, label: 'Costs', iconLabel: 'Back to costs' };

// The search a list's row link opens a reading with: the list's own, plus where it was opened from when that is
// Costs, so the way back returns there.
export function readingSearchFrom(pathname: string, search: string): string {
  const isOnCosts = matchPath({ path: COSTS_ROUTES_PATHS.BASE, end: false }, pathname) !== null;

  if (!isOnCosts) return search;

  const params = new URLSearchParams(search);
  params.set(CAME_FROM_PARAM, CAME_FROM_COSTS);

  return `?${params.toString()}`;
}

// The way back from a reading's page: the list it was opened from, with that list's search and without the marker.
// Only the two known pages, from the route constants: the marker never names a path itself.
export function backPageOf(search: string): BackPage {
  const params = new URLSearchParams(search);
  const isFromCosts = params.get(CAME_FROM_PARAM) === CAME_FROM_COSTS;
  const { pathname, label, iconLabel } = isFromCosts ? COSTS_BACK : HOME_BACK;

  params.delete(CAME_FROM_PARAM);

  const listSearch = params.toString();

  return { to: { pathname, search: listSearch ? `?${listSearch}` : '' }, label, iconLabel };
}
