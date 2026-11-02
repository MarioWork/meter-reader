import type { ReadingApiModel } from '@app-types/models';
import { formatIsoDate } from '@utils/dateUtils';
import DeleteReadingButton from './DeleteReadingButton';
import { HISTORY_CELL_CLASSES } from './historyCellClasses';
import ReadingPhotoViewer from './ReadingPhotoViewer';
import ReadingSendStatus from './ReadingSendStatus';
import SendReadingLink from './SendReadingLink';

type Props = {
  reading: ReadingApiModel;
};

function ReadingHistoryRow({ reading }: Props) {
  return (
    <tr>
      <td className={HISTORY_CELL_CLASSES}>{formatIsoDate(reading.date)}</td>
      <td className={`${HISTORY_CELL_CLASSES} font-mono tabular-nums`}>{reading.digits}</td>
      <td className={HISTORY_CELL_CLASSES}>
        <ReadingSendStatus reading={reading} />
      </td>
      <td className={HISTORY_CELL_CLASSES}>
        <ReadingPhotoViewer reading={reading} />
      </td>
      <td className={HISTORY_CELL_CLASSES}>
        <div className="flex flex-wrap items-center gap-3">
          <SendReadingLink reading={reading} />
          <DeleteReadingButton reading={reading} />
        </div>
      </td>
    </tr>
  );
}

export default ReadingHistoryRow;
