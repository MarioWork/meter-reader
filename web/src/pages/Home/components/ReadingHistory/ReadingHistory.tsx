import type { ReadingApiModel } from '@app-types/models';
import { ReadingStatusUtil } from '@app-types/utility';
import { formatIsoDate } from '@utils/dateUtils';

type Props = {
  readings: ReadingApiModel[];
};

// Always text, never colour alone.
const STATUS_LABELS: Record<ReadingStatusUtil, string> = {
  [ReadingStatusUtil.NOT_SENT]: 'Not sent',
  [ReadingStatusUtil.SENT]: 'Sent',
  [ReadingStatusUtil.FAILED]: 'Failed',
};

const CELL_CLASSES = 'border-b border-gray-200 px-3 py-2';

// The history, newest first, as the API ordered it.
function ReadingHistory({ readings }: Props) {
  if (readings.length === 0) return <p className="text-gray-600">No readings yet. Save your first one.</p>;

  return (
    <table className="w-full border-collapse bg-white text-left">
      <caption className="sr-only">History</caption>
      <thead>
        <tr>
          <th scope="col" className={CELL_CLASSES}>
            Date
          </th>
          <th scope="col" className={CELL_CLASSES}>
            Reading
          </th>
          <th scope="col" className={CELL_CLASSES}>
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {readings.map((reading) => (
          <tr key={reading.id}>
            <td className={CELL_CLASSES}>{formatIsoDate(reading.date)}</td>
            <td className={`${CELL_CLASSES} font-mono tabular-nums`}>{reading.digits}</td>
            <td className={CELL_CLASSES}>{STATUS_LABELS[reading.status]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ReadingHistory;
