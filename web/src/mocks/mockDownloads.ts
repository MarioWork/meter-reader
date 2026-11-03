import { apiLinkUrl, apiPrefixOf } from './mockApiLinks';

// Mock mode only. A download link (<a href download>) makes the browser fetch the file itself, outside the page's
// own requests, so the mock network never sees it and the download is cancelled. Here a click on a download link
// into the API is turned into a fetch (which the mocks answer) and the answer is saved under its own file name.
const DOWNLOAD_LINK_SELECTOR = 'a[download][href]';
const FILE_NAME_PATTERN = /filename="([^"]+)"/;
const FALLBACK_FILE_NAME = 'download';
const UNKNOWN_FAILURE = 'unknown error';

function fileNameOf(response: Response): string {
  const disposition = response.headers.get('content-disposition') ?? '';

  return FILE_NAME_PATTERN.exec(disposition)?.[1] ?? FALLBACK_FILE_NAME;
}

// Saves a fetched file the way a download link would: a temporary object URL on a temporary link.
async function saveResponse(response: Response): Promise<void> {
  const objectUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = fileNameOf(response);
  link.click();
  URL.revokeObjectURL(objectUrl);
}

async function downloadThroughMocks(url: string): Promise<void> {
  try {
    const response = await fetch(url);

    if (response.ok) await saveResponse(response);
  } catch (error) {
    // The reason only, never the thrown value itself.
    console.error('mock download failed', error instanceof Error ? error.message : UNKNOWN_FAILURE);
  }
}

// Only links into the mocked API are taken over; any other download keeps the browser's own behaviour.
export function interceptMockDownloads(baseApiUrl: string): void {
  const apiPrefix = apiPrefixOf(baseApiUrl);

  // Capture phase: runs before the link's default action and before React's own handlers.
  document.addEventListener(
    'click',
    (event) => {
      const url = apiLinkUrl(event, DOWNLOAD_LINK_SELECTOR, apiPrefix);

      if (!url) return;

      event.preventDefault();
      void downloadThroughMocks(url);
    },
    true,
  );
}
