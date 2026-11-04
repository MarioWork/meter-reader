// A path with the search of the request that led to it: Home's filters and pages of the history travel this way
// between Home, a reading's page and their modals.
export function withSearchOf(requestUrl: string, pathname: string): string {
  return `${pathname}${new URL(requestUrl).search}`;
}
