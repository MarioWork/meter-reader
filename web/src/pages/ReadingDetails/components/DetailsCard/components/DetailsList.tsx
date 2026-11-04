import { formatIsoDate, formatTimestamp } from '@utils/dateUtils';

type Props = {
  // The calendar day it was read (YYYY-MM-DD).
  date: string;
  // When it was saved, an ISO timestamp.
  createdAt: string;
};

const LABEL_CLASSES = 'text-muted-foreground';
const READ_ON_LABEL = 'Read on';
const SAVED_LABEL = 'Saved';

// "Read on" and "Saved", as label and value.
function DetailsList({ date, createdAt }: Props) {
  return (
    <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-2">
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
