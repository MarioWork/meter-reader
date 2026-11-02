import type { ReadingApiModel } from '@app-types/models';
import { ReadingStatusUtil } from '@app-types/utility';
import { formatTimestamp } from '@utils/dateUtils';

type Props = {
  reading: ReadingApiModel;
};

// Always text, never colour alone.
const STATUS_LABELS: Record<ReadingStatusUtil, string> = {
  [ReadingStatusUtil.NOT_SENT]: 'Not sent',
  [ReadingStatusUtil.SENT]: 'Sent',
  [ReadingStatusUtil.FAILED]: 'Failed',
};

// Whether the reading's email went out, and when it did.
function ReadingSendStatus({ reading }: Props) {
  const label = STATUS_LABELS[reading.status];

  if (!reading.sentAt) return label;

  return (
    <>
      {label} <time dateTime={reading.sentAt}>{formatTimestamp(reading.sentAt)}</time>
    </>
  );
}

export default ReadingSendStatus;
