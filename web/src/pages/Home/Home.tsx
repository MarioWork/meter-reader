import { useRef } from 'react';
import { Outlet, useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import EmptyHistory from './components/EmptyHistory';
import HomeHeader from './components/HomeHeader';
import LoadMoreHistory from './components/LoadMoreHistory';
import NewReadingBar from './components/NewReadingBar';
import NoMatchingReadings from './components/NoMatchingReadings';
import ReadingHistory from './components/ReadingHistory';
import { loader } from './homeLoader';
import HistoryFilters from '@components/HistoryFilters';
import Tile from '@components/Tile';
import { useHistoryFilters } from '@hooks/useHistoryFilters';
import { useIsWideScreen } from '@hooks/useIsWideScreen';
import { useIsFilteringHistory } from '@hooks/useIsFilteringHistory';
import { cn } from '@utils/classNameUtils';

// Phone first: the title, the filters, the last reading on top, the earlier ones as cards below it, more as the user
// scrolls, and New reading floating in the bottom corner, with room left under the history so the last card and a
// focused control scroll clear of it (WCAG 2.4.11). A wide screen uses the whole column for two tiles: the title, Export, New reading and the filters in one,
// the table in the other.
function Home() {
  const { readings, totalResultNumber, loadedPageCount, hasLoadMoreFailed } =
    useLoaderData<LoaderDataUtil<typeof loader>>();
  const { filters, isFiltered, clearFilters } = useHistoryFilters();
  const isFiltering = useIsFilteringHistory(filters);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const isWideScreen = useIsWideScreen();

  const hasReadings = readings.length > 0;
  // A wide screen gives the history a tile of its own, like the filters' above it.
  const HistoryContainer = isWideScreen ? Tile : 'div';

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
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 pt-6 pb-24 **:scroll-mb-24 sm:max-w-none sm:gap-4 sm:pb-6 sm:**:scroll-mb-0">
      <HistoryFilters
        filterButtonRef={filterButtonRef}
        isSticky
        renderHeader={(filterButton) => (
          <HomeHeader
            filters={filters}
            isFiltered={isFiltered}
            hasReadings={hasReadings}
            totalResultNumber={totalResultNumber}
            filterButton={filterButton}
          />
        )}
      />
      {/* Dims while new filters load, so the change shows at once instead of the list swapping out of nowhere. */}
      <HistoryContainer
        aria-busy={isFiltering}
        className={cn(
          'flex flex-col gap-6 motion-safe:transition-opacity motion-safe:duration-200 sm:gap-4',
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
      </HistoryContainer>
      {!isWideScreen && <NewReadingBar />}
      {/* The routed modals: New reading on a wide screen, and the send preview. */}
      <Outlet />
    </main>
  );
}

export default Home;
