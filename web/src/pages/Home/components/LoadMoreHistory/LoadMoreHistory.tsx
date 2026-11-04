import ErrorAlert from '@components/ErrorAlert';
import { Button } from '@components/ui/button';
import { useEndOfHistoryFocus } from './hooks/useEndOfHistoryFocus';
import { useLoadMoreHistory } from './hooks/useLoadMoreHistory';

type Props = {
  shownCount: number;
  totalResultNumber: number;
  loadedPageCount: number;
  hasFailed: boolean;
};

const LOAD_MORE_LABEL = 'Load more';
const LOADING_MORE_LABEL = 'Loading more…';
const FAILURE_MESSAGE = 'The older readings could not be loaded. Please try again.';

// The end of the history. The next page loads by itself as this comes into view; the Load more button stays for the
// keyboard, screen readers, and a page that failed to load. The count is a polite live region, so screen
// readers hear it change.
function LoadMoreHistory({ shownCount, totalResultNumber, loadedPageCount, hasFailed }: Props) {
  const hasMore = shownCount < totalResultNumber;
  const { loadMoreRef, isLoadingMore, loadMore } = useLoadMoreHistory({ loadedPageCount, hasMore, hasFailed });
  const { countRef } = useEndOfHistoryFocus(hasMore);

  return (
    <div className="flex flex-col items-center gap-3">
      {hasFailed && <ErrorAlert message={FAILURE_MESSAGE} />}
      <p ref={countRef} aria-live="polite" aria-atomic tabIndex={-1} className="text-sm text-muted-foreground">
        Showing {shownCount} of {totalResultNumber} readings
      </p>
      {hasMore && (
        // aria-disabled, not disabled, while it loads: a disabled button drops keyboard focus to the top of the page.
        <Button
          ref={loadMoreRef}
          variant="outline"
          size="lg"
          aria-disabled={isLoadingMore}
          onClick={loadMore}
          // As wide as its words, in the middle; wide enough for the longer label, so it does not jump while it loads.
          className="min-w-36 px-6"
        >
          {isLoadingMore ? LOADING_MORE_LABEL : LOAD_MORE_LABEL}
        </Button>
      )}
    </div>
  );
}

export default LoadMoreHistory;
