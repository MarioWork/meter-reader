import { useReading } from '../../../hooks/useReading';
import { READING_UNIT, READING_UNIT_NAME } from '../readingUnit';
import ReadingUsage from './ReadingUsage';

const LABEL = 'Reading';

// The page's hero: the digits exactly as the meter shows them, big and monospaced, with the unit beside them, and the
// water used since the previous reading under them.
function ReadingDigits() {
  const { digits } = useReading();

  return (
    <div className="flex flex-col gap-1">
      <p className="flex items-baseline gap-2">
        <span className="sr-only">{LABEL}</span>
        <span className="font-mono text-5xl font-semibold tracking-wider tabular-nums sm:text-6xl">{digits}</span>
        <abbr title={READING_UNIT_NAME} className="text-2xl text-muted-foreground no-underline">
          {READING_UNIT}
        </abbr>
      </p>
      <ReadingUsage />
    </div>
  );
}

export default ReadingDigits;
