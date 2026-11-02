import { Outlet, useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import EmptyHistory from './components/EmptyHistory';
import LoadMoreHistory from './components/LoadMoreHistory';
import NewReadingBar from './components/NewReadingBar';
import ReadingHistory from './components/ReadingHistory';
import { loader } from './homeLoader';

// Phone first: the last reading on top, the earlier ones as cards below it, more as the user scrolls, and New reading
// stuck to the bottom. A focused control scrolled to the bottom keeps clear of that bar (WCAG 2.4.11).
function Home() {
  const { readings, totalResultNumber, loadedPageCount, hasLoadMoreFailed } =
    useLoaderData<LoaderDataUtil<typeof loader>>();
  const [lastReading, ...earlierReadings] = readings;
  const hasReadings = readings.length > 0;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-6 **:scroll-mb-24">
      <h1 className="text-2xl font-bold">History</h1>
      {hasReadings ? <ReadingHistory lastReading={lastReading} earlierReadings={earlierReadings} /> : <EmptyHistory />}
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
