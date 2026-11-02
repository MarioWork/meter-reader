import { useEffect, useRef } from 'react';
import type { ReadingApiModel } from '@app-types/models';

// The same reading in the same state: same id, same status.
function isSameReading(reading: ReadingApiModel | undefined, otherReading: ReadingApiModel | undefined): boolean {
  return reading?.id === otherReading?.id && reading?.status === otherReading?.status;
}

// True when every reading shown before is still shown, in the same place and with the same status: "Load more" only
// added readings after them.
function isOnlyAppended(shownReadings: ReadingApiModel[], readings: ReadingApiModel[]): boolean {
  return shownReadings.every((shownReading, index) => isSameReading(shownReading, readings[index]));
}

// A deleted reading takes its "⋯" button with it, and a sent one its Send link: focus drops back to the top of the
// page. Once the history has re-rendered, focus goes to the part that changed instead, so a keyboard user carries on
// from there: the last reading's card when the newest reading changed, the earlier readings otherwise. Not on the
// first render, and not when "Load more" only added readings: focus stays where it is.
export function useHistoryFocus(readings: ReadingApiModel[]) {
  const lastReadingRef = useRef<HTMLElement>(null);
  const earlierReadingsRef = useRef<HTMLElement>(null);
  const shownReadings = useRef(readings);

  useEffect(() => {
    const hasHistoryChanged = !isOnlyAppended(shownReadings.current, readings);
    const hasLastReadingChanged = !isSameReading(shownReadings.current[0], readings[0]);
    const isFocusLost = document.activeElement === document.body;

    shownReadings.current = readings;

    if (!hasHistoryChanged || !isFocusLost) return;

    const changedPart = hasLastReadingChanged ? lastReadingRef : earlierReadingsRef;

    changedPart.current?.focus();
  }, [readings]);

  return { lastReadingRef, earlierReadingsRef };
}
