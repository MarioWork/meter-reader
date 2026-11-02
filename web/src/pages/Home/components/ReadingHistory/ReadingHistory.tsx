import { useEffect, useRef } from 'react';
import type { ReadingApiModel } from '@app-types/models';
import ReadingHistoryHeader from './components/ReadingHistoryHeader';
import ReadingHistoryRow from './components/ReadingHistoryRow';

type Props = {
  readings: ReadingApiModel[];
};

// The history, newest first, as the API ordered it.
function ReadingHistory({ readings }: Props) {
  const tableRef = useRef<HTMLTableElement>(null);
  const shownReadings = useRef(readings);

  // A deleted row takes its Delete button (and the dialog) with it, and focus drops back to the top of the page.
  // Once the history has re-rendered, focus goes to the table instead, so a keyboard user carries on from there.
  // Only when the history changed: on the first render focus is left where the browser put it.
  useEffect(() => {
    const hasHistoryChanged = shownReadings.current !== readings;
    const isFocusLost = document.activeElement === document.body;

    shownReadings.current = readings;

    if (hasHistoryChanged && isFocusLost) tableRef.current?.focus();
  }, [readings]);

  if (readings.length === 0) return <p className="text-gray-600">No readings yet. Save your first one.</p>;

  return (
    <table
      ref={tableRef}
      tabIndex={-1}
      className="w-full border-collapse bg-white text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
    >
      <caption className="sr-only">History</caption>
      <thead>
        <ReadingHistoryHeader />
      </thead>
      <tbody>
        {readings.map((reading) => (
          <ReadingHistoryRow key={reading.id} reading={reading} />
        ))}
      </tbody>
    </table>
  );
}

export default ReadingHistory;
