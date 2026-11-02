import { useRef } from 'react';
import { Outlet, useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import EmptyHistory from './components/EmptyHistory';
import HistoryFilters from './components/HistoryFilters';
import LoadMoreHistory from './components/LoadMoreHistory';
import NewReadingBar from './components/NewReadingBar';
import NoMatchingReadings from './components/NoMatchingReadings';
import ReadingHistory from './components/ReadingHistory';
import { loader } from './homeLoader';
import { useHistoryFilters } from './hooks/useHistoryFilters';

// Phone first: the filters, the last reading on top, the earlier ones as cards below it, more as the user scrolls,
// and New reading stuck to the bottom. A focused control scrolled to the bottom keeps clear of that bar (WCAG 2.4.11).
function Home() {
  const { readings, totalResultNumber, loadedPageCount, hasLoadMoreFailed } =
    useLoaderData<LoaderDataUtil<typeof loader>>();
  const { isFiltered, clearFilters } = useHistoryFilters();
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  const hasReadings = readings.length > 0;

  // Clear filters goes with the empty result; focus goes to the Filter button instead of the top of the page.
  const clearFiltersFromEmptyResult = () => {
    filterButtonRef.current?.focus();
    clearFilters();
  };

  const emptyHistory = isFiltered ? (
    <NoMatchingReadings onClearFilters={clearFiltersFromEmptyResult} />
  ) : (
    <EmptyHistory />
  );

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-6 **:scroll-mb-24">
      <h1 className="text-2xl font-bold">History</h1>
      <HistoryFilters filterButtonRef={filterButtonRef} />
      {hasReadings ? <ReadingHistory readings={readings} isFiltered={isFiltered} /> : emptyHistory}
      {hasReadings && (
        <LoadMoreHistory
          shownCount={readings.length}
          totalResultNumber={totalResultNumber}
          loadedPageCount={loadedPageCount}
          hasFailed={hasLoadMoreFailed}
        />
      )}
      <NewReadingBar />
      {/* The send preview, a routed modal. */}
      <Outlet />
    </main>
  );
}

export default Home;
