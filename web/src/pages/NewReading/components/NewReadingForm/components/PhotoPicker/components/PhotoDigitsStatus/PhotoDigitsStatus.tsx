import LoadingDigits from '@components/LoadingDigits';
import { DigitsReadStatus } from '../../../../types';

type Props = {
  status: DigitsReadStatus;
};

const STATUS_MESSAGES: Record<DigitsReadStatus, string> = {
  [DigitsReadStatus.IDLE]: '',
  [DigitsReadStatus.READING]: 'Reading the number from the photo…',
  [DigitsReadStatus.NOTHING_FOUND]: 'No number found in the photo. Type it in.',
  [DigitsReadStatus.TIMED_OUT]: "Couldn't read the number from the photo. Type it in.",
};

// Always in the page, so a screen reader hears each change of the message (a live region added with its text in
// it is often missed). Empty, it is visually hidden but stays in the accessibility tree (display: none would not).
// The loading meter only shows the work going on; the message already says it, so it is hidden from screen readers.
function PhotoDigitsStatus({ status }: Props) {
  const isReading = status === DigitsReadStatus.READING;

  return (
    <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground empty:sr-only">
      {isReading && <LoadingDigits />}
      {STATUS_MESSAGES[status]}
    </p>
  );
}

export default PhotoDigitsStatus;
