import { Suspense } from 'react';
import { Await, Outlet, useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import BackToReadingsLink from './components/BackToReadingsLink';
import ReadingContent from './components/ReadingContent';
import ReadingLoadFailure from './components/ReadingLoadFailure';
import ReadingNotFound from './components/ReadingNotFound';
import ReadingSkeleton from './components/ReadingSkeleton';
import type { loader } from './readingDetailsLoader';

// One reading in full, on its own page: the way back to the same history first, then the reading as soon as it has
// loaded (its place held until then), or a not-found note when there is no such reading. The send preview and the
// cost & bill dialog open over it as routed modals.
function ReadingDetails() {
  const { reading } = useLoaderData<LoaderDataUtil<typeof loader>>();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 pt-6 pb-10 sm:max-w-none">
      <BackToReadingsLink />
      <Suspense fallback={<ReadingSkeleton />}>
        <Await resolve={reading} errorElement={<ReadingLoadFailure />}>
          {(loadedReading) => (loadedReading ? <ReadingContent reading={loadedReading} /> : <ReadingNotFound />)}
        </Await>
      </Suspense>
      <Outlet />
    </main>
  );
}

export default ReadingDetails;
