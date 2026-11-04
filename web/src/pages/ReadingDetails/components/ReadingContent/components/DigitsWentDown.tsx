import { TriangleAlertIcon } from 'lucide-react';
import type { ReadingNeighbourApiModel } from '@app-types/models';
import { formatIsoDate } from '@utils/dateUtils';
import { READING_UNIT } from '../readingUnit';

type Props = {
  cubicMetres: number;
  previous: ReadingNeighbourApiModel;
};

const LOWER_THAN_PREVIOUS = 'lower than the previous reading';
const PREVIOUS_READING_ON = 'The previous reading, on';
const WAS = 'was';
const LIKELY_CAUSE = 'The meter may have been replaced, or one of the two readings mistyped.';

// Digits lower than the previous reading's: how far they went down, said as that and never as water used, with what
// the previous reading was so the user can see which one is off.
function DigitsWentDown({ cubicMetres, previous }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <p className="flex items-center gap-2 text-lg font-medium text-warning">
        <TriangleAlertIcon aria-hidden="true" className="size-5 shrink-0" />
        {cubicMetres} {READING_UNIT} {LOWER_THAN_PREVIOUS}
      </p>
      <p className="text-sm text-muted-foreground">
        {PREVIOUS_READING_ON} {formatIsoDate(previous.date)}, {WAS} {previous.digits}. {LIKELY_CAUSE}
      </p>
    </div>
  );
}

export default DigitsWentDown;
