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
import { useIsFilteringHistory } from './hooks/useIsFilteringHistory';
import { cn } from '@utils/classNameUtils';

// Phone first: the filters, the last reading on top, the earlier ones as cards below it, more as the user scrolls,
// and New reading stuck to the bottom. A focused control scrolled to the bottom keeps clear of that bar (WCAG 2.4.11).
function Home() {
  const { readings, totalResultNumber, loadedPageCount, hasLoadMoreFailed } =
    useLoaderData<LoaderDataUtil<typeof loader>>();
  const { filters, isFiltered, clearFilters } = useHistoryFilters();
  const isFiltering = useIsFilteringHistory(filters);
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
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 pt-6 **:scroll-mb-24">
      <h1 className="text-2xl font-bold">Water Readings</h1>
      <HistoryFilters filterButtonRef={filterButtonRef} />
      {/* Dims while new filters load, so the change shows at once instead of the list swapping out of nowhere. */}
      <div
        aria-busy={isFiltering}
        className={cn(
          'flex flex-col gap-6 motion-safe:transition-opacity motion-safe:duration-200',
          isFiltering && 'opacity-50',
        )}
      >
        {hasReadings ? <ReadingHistory readings={readings} isFiltered={isFiltered} /> : emptyHistory}
        {hasReadings && (
          <LoadMoreHistory
            shownCount={readings.length}
            totalResultNumber={totalResultNumber}
            loadedPageCount={loadedPageCount}
            hasFailed={hasLoadMoreFailed}
          />
        )}
      </div>
      <NewReadingBar />
      {/* The routed modals: New reading on a wide screen, and the send preview. */}
      <Outlet />
    </main>
  );
}

export default Home;
