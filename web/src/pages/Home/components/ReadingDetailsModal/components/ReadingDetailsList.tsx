import type { ReadingApiModel } from '@app-types/models';
import { formatIsoDate, formatTimestamp } from '@utils/dateUtils';
import ReadingSendStatus from '../../ReadingSendStatus';

type Props = {
  reading: ReadingApiModel;
};

const NO_PHOTO_LABEL = 'No photo';
const LABEL_CLASSES = 'text-sm text-muted-foreground';

// Every field of the reading as label and value: the digits big, as on the meter, then the day, the save time, the
// photo and whether it was sent.
function ReadingDetailsList({ reading }: Props) {
  const hasPhoto = reading.photoId !== null;

  return (
    <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-3">
      <dt className={LABEL_CLASSES}>Reading</dt>
      <dd className="font-mono text-3xl font-semibold tracking-wider tabular-nums">{reading.digits}</dd>
      <dt className={LABEL_CLASSES}>Read on</dt>
      <dd>{formatIsoDate(reading.date)}</dd>
      <dt className={LABEL_CLASSES}>Saved</dt>
      <dd>
        <time dateTime={reading.createdAt}>{formatTimestamp(reading.createdAt)}</time>
      </dd>
      {!hasPhoto && (
        <>
          <dt className={LABEL_CLASSES}>Photo</dt>
          <dd>{NO_PHOTO_LABEL}</dd>
        </>
      )}
      <dt className={LABEL_CLASSES}>Status</dt>
      <dd>
        <ReadingSendStatus reading={reading} />
      </dd>
    </dl>
  );
}

export default ReadingDetailsList;
