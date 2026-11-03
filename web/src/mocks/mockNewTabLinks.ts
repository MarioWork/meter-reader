import { apiLinkUrl, apiPrefixOf } from './mockApiLinks';

// Mock mode only. A link that opens in a new tab (a Bill's) loads a page of its own, outside the app's requests, so
// the mock network never sees it and the tab would ask the real API, which is not running. Here a click on such a
// link into the API opens the tab at once (while the click still allows one), fetches the file through the mocks
// and shows it from an object URL, as the browser or the phone's viewer app would show the API's.
const NEW_TAB_LINK_SELECTOR = 'a[target="_blank"][href]';
const NEW_TAB = '_blank';
const BLANK_PAGE = '';
// Long enough for the tab to load the file; it holds its own copy after that.
const OBJECT_URL_LIFETIME_MS = 60_000;
const UNKNOWN_FAILURE = 'unknown error';
const MIDDLE_BUTTON = 1;

async function showThroughMocks(url: string, tab: Window): Promise<void> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      tab.close();

      return;
    }

    const objectUrl = URL.createObjectURL(await response.blob());

    tab.location.href = objectUrl;
    setTimeout(() => URL.revokeObjectURL(objectUrl), OBJECT_URL_LIFETIME_MS);
  } catch (error) {
    tab.close();
    // The reason only, never the thrown value itself.
    console.error('mock new tab failed', error instanceof Error ? error.message : UNKNOWN_FAILURE);
  }
}

function openThroughMocks(event: MouseEvent, apiPrefix: string): void {
  const url = apiLinkUrl(event, NEW_TAB_LINK_SELECTOR, apiPrefix);

  if (!url) return;

  event.preventDefault();

  const tab = window.open(BLANK_PAGE, NEW_TAB);

  if (!tab) return;

  // As the link's rel="noopener" would: the new tab gets no handle on the app.
  tab.opener = null;
  void showThroughMocks(url, tab);
}

export function interceptMockNewTabLinks(baseApiUrl: string): void {
  const apiPrefix = apiPrefixOf(baseApiUrl);

  // Capture phase: runs before the link's default action and before React's own handlers.
  document.addEventListener('click', (event) => openThroughMocks(event, apiPrefix), true);
  // A middle click opens a link in a new tab too, through its own event.
  document.addEventListener(
    'auxclick',
    (event) => {
      if (event.button === MIDDLE_BUTTON) openThroughMocks(event, apiPrefix);
    },
    true,
  );
}
