import type { ReadingApiModel } from '@app-types/models';
import ReadingSendStatus from '@components/ReadingSendStatus';
import { formatIsoDate, formatTimestamp } from '@utils/dateUtils';

type Props = {
  reading: ReadingApiModel;
};

const LABEL_CLASSES = 'text-muted-foreground';
const STATUS_LABEL = 'Status';
const READ_ON_LABEL = 'Read on';
const SAVED_LABEL = 'Saved';

// "Status" (the chip and, once sent, when, as beside the title), "Read on" and "Saved", as label and value.
function DetailsList({ reading }: Props) {
  const { date, createdAt } = reading;

  return (
    <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-2">
      <dt className={LABEL_CLASSES}>{STATUS_LABEL}</dt>
      <dd>
        <ReadingSendStatus reading={reading} />
      </dd>
      <dt className={LABEL_CLASSES}>{READ_ON_LABEL}</dt>
      <dd>{formatIsoDate(date)}</dd>
      <dt className={LABEL_CLASSES}>{SAVED_LABEL}</dt>
      <dd>
        <time dateTime={createdAt}>{formatTimestamp(createdAt)}</time>
      </dd>
    </dl>
  );
}

export default DetailsList;
