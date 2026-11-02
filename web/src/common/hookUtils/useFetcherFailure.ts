import type { FetcherWithComponents } from 'react-router';
import type { JSONResponseUtil } from '@app-types/utility';

// The message to show once a fetcher's submit has failed: the API's own message, or `fallback` when it sent none.
// Undefined while the submit runs and after a success.
export function useFetcherFailure(fetcher: FetcherWithComponents<JSONResponseUtil | undefined>, fallback: string) {
  const isIdle = fetcher.state === 'idle';
  const hasFailed = fetcher.data?.success === false;

  if (!isIdle || !hasFailed) return undefined;

  return fetcher.data?.error?.message ?? fallback;
}
