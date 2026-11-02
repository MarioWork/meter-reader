import { Spinner } from '@components/ui/spinner';

type Props = {
  isFindingDigits: boolean;
  hasFoundNothing: boolean;
};

const FINDING_DIGITS_MESSAGE = 'Reading the number from the photo…';
const NOTHING_FOUND_MESSAGE = 'No number found in the photo. Type it in.';

function statusMessage({ isFindingDigits, hasFoundNothing }: Props): string {
  if (isFindingDigits) return FINDING_DIGITS_MESSAGE;
  if (hasFoundNothing) return NOTHING_FOUND_MESSAGE;

  return '';
}

// Always in the page, so a screen reader hears each change of the message (a live region added with its text in
// it is often missed). Empty, it is visually hidden but stays in the accessibility tree (display: none would not).
// The spinner only shows the work going on; the message already says it, so it is hidden from screen readers.
function PhotoDigitsStatus({ isFindingDigits, hasFoundNothing }: Props) {
  return (
    <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground empty:sr-only">
      {isFindingDigits && <Spinner role={undefined} aria-hidden />}
      {statusMessage({ isFindingDigits, hasFoundNothing })}
    </p>
  );
}

export default PhotoDigitsStatus;
