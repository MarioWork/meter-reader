// Mock mode only. What the link interceptors (mockDownloads.ts, mockNewTabLinks.ts) share: which clicks they take.

// The path every API url starts with, from the base url the app calls ("/api").
export function apiPrefixOf(baseApiUrl: string): string {
  return new URL(baseApiUrl, window.location.href).pathname;
}

// The url of the link clicked, when it matches the selector and goes into the mocked API. Any other link is left to
// the browser.
export function apiLinkUrl(event: MouseEvent, selector: string, apiPrefix: string): string | undefined {
  const link = event.target instanceof Element ? event.target.closest(selector) : null;

  if (!(link instanceof HTMLAnchorElement)) return undefined;

  const url = new URL(link.href, window.location.href);
  const isApiLink = url.origin === window.location.origin && url.pathname.startsWith(apiPrefix);

  return isApiLink ? url.toString() : undefined;
}
