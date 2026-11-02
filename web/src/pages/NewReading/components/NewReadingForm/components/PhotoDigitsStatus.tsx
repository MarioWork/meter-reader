type Props = {
  isReading: boolean;
  hasFoundNothing: boolean;
};

const READING_MESSAGE = 'Reading the number from the photo…';
const NOTHING_FOUND_MESSAGE = 'No number found in the photo. Type it in.';

function statusMessage({ isReading, hasFoundNothing }: Props): string {
  if (isReading) return READING_MESSAGE;
  if (hasFoundNothing) return NOTHING_FOUND_MESSAGE;

  return '';
}

// Always in the page, so a screen reader hears each change of the message (a live region added with its text in
// it is often missed).
function PhotoDigitsStatus({ isReading, hasFoundNothing }: Props) {
  return (
    <p role="status" className="text-sm text-gray-600 empty:hidden">
      {statusMessage({ isReading, hasFoundNothing })}
    </p>
  );
}

export default PhotoDigitsStatus;
