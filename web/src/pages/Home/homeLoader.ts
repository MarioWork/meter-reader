import axios from 'axios';
import type { LoaderFunctionArgs } from 'react-router';
import readingService from '@services/readingService/readingService';
import type { ReadingApiModel } from '@app-types/models';
import { HOME_SEARCH_PARAMS } from '@application/routes/routesUtils';
import { DEFAULT_FIRST_PAGE, DEFAULT_PAGINATION, PAGE_SIZE } from '@app-types/utility';
import { readHistoryFilters } from './historyFilterUtils';
import type { HistoryFilterValues } from './types';

const FIRST_PAGE = Number(DEFAULT_FIRST_PAGE);

// How many pages of the history the url asks for: `?pages=3` shows the first three. Anything that is not a whole
// number of at least one shows the first page.
function requestedPageCount(searchParams: URLSearchParams): number {
  const pageCount = Number(searchParams.get(HOME_SEARCH_PARAMS.SHOWN_PAGES));
  const isWholePageCount = Number.isInteger(pageCount) && pageCount >= FIRST_PAGE;

  if (!isWholePageCount) return FIRST_PAGE;

  return pageCount;
}

// The pages after the first, up to `lastPage`.
function laterPageNumbers(lastPage: number): number[] {
  return Array.from({ length: lastPage - FIRST_PAGE }, (_, index) => FIRST_PAGE + 1 + index);
}

// One page of the history, narrowed by the filters.
function getReadingsPage(page: number, filters: HistoryFilterValues) {
  const fields = { pagination: { page: String(page), size: PAGE_SIZE }, ...filters };

  return readingService.getReadings(fields);
}

type LaterPages = {
  readings: ReadingApiModel[];
  loadedPageCount: number;
  hasFailed: boolean;
};

type ReadingsPage = Awaited<ReturnType<typeof getReadingsPage>>;

function isRejected(result: PromiseSettledResult<ReadingsPage>): result is PromiseRejectedResult {
  return result.status === 'rejected';
}

function isFulfilled(result: PromiseSettledResult<ReadingsPage>): result is PromiseFulfilledResult<ReadingsPage> {
  return result.status === 'fulfilled';
}

// The later pages that loaded, in order, up to the first that did not. A failed request leaves the pages before it
// on screen and lets the user try again; anything else is a bug and still lands on the error page.
function keepLoadedPages(results: PromiseSettledResult<ReadingsPage>[]): LaterPages {
  const failure = results.find(isRejected);

  if (failure && !axios.isAxiosError(failure.reason)) throw failure.reason;

  const failedIndex = failure ? results.indexOf(failure) : results.length;
  const loadedPages = results.slice(0, failedIndex).filter(isFulfilled);

  return {
    readings: loadedPages.flatMap((page) => page.value.data),
    loadedPageCount: loadedPages.length,
    hasFailed: failure !== undefined,
  };
}

// The history, newest first, from the first page up to the page the url asks for, so "Load more" and any write
// (send, delete) see the same readings once the loader runs again. A page past the end shows the whole history.
// Every page is narrowed by the filters in the url.
export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;
  const filters = readHistoryFilters(searchParams);

  const firstPageFields = { pagination: DEFAULT_PAGINATION, ...filters };
  const firstPage = await readingService.getReadings(firstPageFields);

  const pageCount = Math.max(FIRST_PAGE, Math.ceil(firstPage.totalResultNumber / Number(PAGE_SIZE)));
  const lastPageToLoad = Math.min(requestedPageCount(searchParams), pageCount);

  const laterPageRequests = laterPageNumbers(lastPageToLoad).map((page) => getReadingsPage(page, filters));
  const laterPageResults = await Promise.allSettled(laterPageRequests);
  const laterPages = keepLoadedPages(laterPageResults);

  return {
    readings: [...firstPage.data, ...laterPages.readings],
    totalResultNumber: firstPage.totalResultNumber,
    loadedPageCount: FIRST_PAGE + laterPages.loadedPageCount,
    hasLoadMoreFailed: laterPages.hasFailed,
  };
}
