import type { ReadingApiModel } from '@app-types/models';
import ReadingHistoryHeader from './components/ReadingHistoryHeader';
import ReadingHistoryRow from './components/ReadingHistoryRow';

type Props = {
  readings: ReadingApiModel[];
};

// The history, newest first, as the API ordered it.
function ReadingHistory({ readings }: Props) {
  if (readings.length === 0) return <p className="text-gray-600">No readings yet. Save your first one.</p>;

  return (
    <table className="w-full border-collapse bg-white text-left">
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
