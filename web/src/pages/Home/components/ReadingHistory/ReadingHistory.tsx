import type { ReadingApiModel } from '@app-types/models';
import ReadingHistoryHeader from './components/ReadingHistoryHeader';
import ReadingHistoryRow from './components/ReadingHistoryRow';
import { useHistoryFocus } from './hooks/useHistoryFocus';

type Props = {
  readings: ReadingApiModel[];
};

// The history, newest first, as the API ordered it.
function ReadingHistory({ readings }: Props) {
  const { tableRef } = useHistoryFocus(readings);

  if (readings.length === 0) return <p className="text-muted-foreground">No readings yet. Save your first one.</p>;

  return (
    <table
      ref={tableRef}
      tabIndex={-1}
      className="w-full border-collapse bg-card text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
