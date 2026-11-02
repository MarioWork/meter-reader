import { redirect, type DataStrategyResult, type MiddlewareFunction } from 'react-router';
import { isUnauthorizedFailure } from '@api/axiosActions';
import { AUTH_ROUTES_PATHS } from './routesUtils';

type RouteResults = Record<string, DataStrategyResult>;

function isRouteResults(value: unknown): value is RouteResults {
  return typeof value === 'object' && value !== null;
}

function hasUnauthorizedResult(results: RouteResults): boolean {
  return Object.values(results).some((routeResult) => isUnauthorizedFailure(routeResult?.result));
}

// Every route whose result says "no valid session" gets a redirect to the login page; the others keep theirs.
function redirectEachToLogin(results: RouteResults): RouteResults {
  const entries = Object.entries(results).map(([routeId, routeResult]) => {
    if (!isUnauthorizedFailure(routeResult?.result)) return [routeId, routeResult];

    // One Response per route: the router rewrites a redirect's Location header in place.
    return [routeId, { type: 'data', result: redirect(AUTH_ROUTES_PATHS.LOGIN) }];
  });

  return Object.fromEntries(entries) as RouteResults;
}

// Root middleware: the one place a lost session is noticed. It lets every loader and action run, then turns each
// "no valid session" answer (a read that threw a 401, an action's UNAUTHORIZED envelope) into a trip to the login
// page. The router follows a redirect for a navigation and a fetcher alike, so the error page never shows for an
// expired sign-in.
export const authMiddleware: MiddlewareFunction = async (_args, next) => {
  const results = await next();

  if (!isRouteResults(results) || !hasUnauthorizedResult(results)) return results;

  return redirectEachToLogin(results);
};
