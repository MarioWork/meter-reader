import { useEffect, useRef } from 'react';

// The last page takes the Load more button away, and with it keyboard focus, which drops back to the top of the page.
// Focus goes to the count in its place instead ("Showing 14 of 14 readings"), without scrolling, so a keyboard user
// carries on from the end of the history.
export function useEndOfHistoryFocus(hasMore: boolean) {
  const countRef = useRef<HTMLParagraphElement>(null);
  const hadMore = useRef(hasMore);

  useEffect(() => {
    const hasReachedEnd = hadMore.current && !hasMore;
    const isFocusLost = document.activeElement === document.body;

    hadMore.current = hasMore;

    if (hasReachedEnd && isFocusLost) countRef.current?.focus({ preventScroll: true });
  }, [hasMore]);

  return { countRef };
}
