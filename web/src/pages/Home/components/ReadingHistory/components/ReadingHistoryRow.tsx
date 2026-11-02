import type { ReadingApiModel } from '@app-types/models';
import { ReadingStatusUtil } from '@app-types/utility';
import { formatIsoDate } from '@utils/dateUtils';
import { HISTORY_CELL_CLASSES } from './historyCellClasses';

type Props = {
  reading: ReadingApiModel;
};

// Always text, never colour alone.
const STATUS_LABELS: Record<ReadingStatusUtil, string> = {
  [ReadingStatusUtil.NOT_SENT]: 'Not sent',
  [ReadingStatusUtil.SENT]: 'Sent',
  [ReadingStatusUtil.FAILED]: 'Failed',
};

function ReadingHistoryRow({ reading }: Props) {
  return (
    <tr>
      <td className={HISTORY_CELL_CLASSES}>{formatIsoDate(reading.date)}</td>
      <td className={`${HISTORY_CELL_CLASSES} font-mono tabular-nums`}>{reading.digits}</td>
      <td className={HISTORY_CELL_CLASSES}>{STATUS_LABELS[reading.status]}</td>
    </tr>
  );
}

export default ReadingHistoryRow;
