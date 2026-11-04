import { useReading } from '../../../hooks/useReading';
import { READING_UNIT } from '../readingUnit';
import { getReadingUsage, ReadingUsageKind } from '../readingUsageUtils';
import DigitsWentDown from './DigitsWentDown';

const FIRST_READING = 'First reading';
const SAME_DAY = 'on the same day';
const ONE_DAY = 1;
const IN = 'in';
const DAY = 'day';
const DAYS = 'days';

// "in 31 days", "in 1 day", or "on the same day" for two readings of one day.
function toDaysText(days: number): string {
  if (days === 0) return SAME_DAY;

  if (days === ONE_DAY) return `${IN} ${days} ${DAY}`;

  return `${IN} ${days} ${DAYS}`;
}

// Under the digits: the water used since the previous reading by date, "+12 m³ in 31 days". The first reading ever
// has nothing to count from, and digits lower than the previous reading's are never shown as usage.
function ReadingUsage() {
  const usage = getReadingUsage(useReading());

  if (usage.kind === ReadingUsageKind.FIRST) return <p className="text-lg text-muted-foreground">{FIRST_READING}</p>;

  if (usage.kind === ReadingUsageKind.WENT_DOWN) {
    return <DigitsWentDown cubicMetres={usage.cubicMetres} previous={usage.previous} />;
  }

  return (
    <p className="text-lg text-muted-foreground">
      +{usage.cubicMetres} {READING_UNIT} {toDaysText(usage.days)}
    </p>
  );
}

export default ReadingUsage;
