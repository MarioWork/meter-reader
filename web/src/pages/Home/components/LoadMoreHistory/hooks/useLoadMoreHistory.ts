import { useEffect, useEffectEvent, useRef } from 'react';
import { useNavigation, useSearchParams } from 'react-router';
import { HOME_SEARCH_PARAMS } from '@application/routes/routesUtils';

type LoadMoreHistoryOptions = {
  loadedPageCount: number;
  hasMore: boolean;
  hasFailed: boolean;
};

// "Load more" asks the url for one more page, so Home's loader brings it in with the pages already shown. In place:
// no new history entry, no jump to the top.
//
// The button loads the next page by itself once it scrolls into view. Not after a failure, which would retry for as
// long as the button stays in view: the user presses it to try again. The observer is made again after every page,
// so a screen still not full keeps loading.
export function useLoadMoreHistory({ loadedPageCount, hasMore, hasFailed }: LoadMoreHistoryOptions) {
  const loadMoreRef = useRef<HTMLButtonElement>(null);
  const [, setSearchParams] = useSearchParams();
  const navigation = useNavigation();

  const nextPage = String(loadedPageCount + 1);
  const pendingPage = new URLSearchParams(navigation.location?.search).get(HOME_SEARCH_PARAMS.SHOWN_PAGES);
  const isLoadingMore = navigation.state === 'loading' && pendingPage === nextPage;
  const canLoadByScrolling = hasMore && !hasFailed && !isLoadingMore;

  const loadMore = () => {
    if (isLoadingMore) return;

    void setSearchParams(
      (searchParams) => {
        searchParams.set(HOME_SEARCH_PARAMS.SHOWN_PAGES, nextPage);

        return searchParams;
      },
      { replace: true, preventScrollReset: true },
    );
  };

  // Reads the latest page count when the observer fires, without making the observer again on every render.
  const loadMoreInView = useEffectEvent(loadMore);

  useEffect(() => {
    const loadMoreButton = loadMoreRef.current;
    const isObserverSupported = typeof IntersectionObserver !== 'undefined';

    if (!loadMoreButton || !canLoadByScrolling || !isObserverSupported) return;

    const observer = new IntersectionObserver((entries) => {
      const isInView = entries.some((entry) => entry.isIntersecting);

      if (isInView) loadMoreInView();
    });

    observer.observe(loadMoreButton);

    return () => observer.disconnect();
  }, [canLoadByScrolling, loadedPageCount]);

  return { loadMoreRef, isLoadingMore, loadMore };
}
