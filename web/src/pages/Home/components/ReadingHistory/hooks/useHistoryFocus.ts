import { useEffect, useRef } from 'react';
import type { ReadingApiModel } from '@app-types/models';

// A deleted row takes its Delete button (and the dialog) with it, and focus drops back to the top of the page.
// Once the history has re-rendered, focus goes to the table instead, so a keyboard user carries on from there.
// Only when the history changed: on the first render focus is left where the browser put it.
export function useHistoryFocus(readings: ReadingApiModel[]) {
  const tableRef = useRef<HTMLTableElement>(null);
  const shownReadings = useRef(readings);

  useEffect(() => {
    const hasHistoryChanged = shownReadings.current !== readings;
    const isFocusLost = document.activeElement === document.body;

    shownReadings.current = readings;

    if (hasHistoryChanged && isFocusLost) tableRef.current?.focus();
  }, [readings]);

  return { tableRef };
}
