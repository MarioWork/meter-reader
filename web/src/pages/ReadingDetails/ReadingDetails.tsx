import { Suspense } from 'react';
import { Await, Outlet, useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import BackToReadingsLink from './components/BackToReadingsLink';
import ReadingContent from './components/ReadingContent';
import ReadingLoadFailure from './components/ReadingLoadFailure';
import ReadingNotFound from './components/ReadingNotFound';
import ReadingSkeleton from './components/ReadingSkeleton';
import type { loader } from './readingDetailsLoader';

// One reading in full, on its own page, as soon as it has loaded (its place held until then). The loaded reading has
// its way back as a chevron beside its title; while it loads, fails or is not there, "← Readings" sits above instead.
// A phone keeps the gaps tighter, so the reading starts higher up. The send preview and the cost & bill dialog open
// over it as routed modals.
function ReadingDetails() {
  const { reading } = useLoaderData<LoaderDataUtil<typeof loader>>();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 pt-4 pb-10 sm:max-w-none sm:gap-6 sm:pt-6">
      <Suspense
        fallback={
          <>
            <BackToReadingsLink />
            <ReadingSkeleton />
          </>
        }
      >
        <Await
          resolve={reading}
          errorElement={
            <>
              <BackToReadingsLink />
              <ReadingLoadFailure />
            </>
          }
        >
          {(loadedReading) =>
            loadedReading ? (
              <ReadingContent reading={loadedReading} />
            ) : (
              <>
                <BackToReadingsLink />
                <ReadingNotFound />
              </>
            )
          }
        </Await>
      </Suspense>
      <Outlet />
    </main>
  );
}

export default ReadingDetails;
