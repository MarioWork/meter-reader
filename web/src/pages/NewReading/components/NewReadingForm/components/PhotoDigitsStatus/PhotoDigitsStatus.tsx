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
function PhotoDigitsStatus({ isFindingDigits, hasFoundNothing }: Props) {
  return (
    <p role="status" className="text-sm text-gray-600 empty:sr-only">
      {statusMessage({ isFindingDigits, hasFoundNothing })}
    </p>
  );
}

export default PhotoDigitsStatus;
