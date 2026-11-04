import { isRouteErrorResponse } from 'react-router';

const NOT_FOUND_STATUS = 404;

export type RouteErrorKind = 'notFound' | 'broken';

export type RouteErrorCopy = {
  // The little tag hanging off the mascot, the way a label hangs off a meter.
  label: string;
  title: string;
  description: string;
};

export const ROUTE_ERROR_COPY: Record<RouteErrorKind, RouteErrorCopy> = {
  notFound: {
    label: 'Reading 404',
    title: 'This page went off the dial',
    description: "We checked every digit, but this page isn't here. The link may be old or mistyped.",
  },
  broken: {
    label: 'Oops',
    title: 'Something skipped a beat',
    description: 'This page tripped on the way in. Try again, or head back home.',
  },
};

// An unknown address (or a loader's 404) is "not found"; anything else broke on the way in.
export function routeErrorKindOf(error: unknown): RouteErrorKind {
  const isNotFound = isRouteErrorResponse(error) && error.status === NOT_FOUND_STATUS;

  if (isNotFound) return 'notFound';

  return 'broken';
}
