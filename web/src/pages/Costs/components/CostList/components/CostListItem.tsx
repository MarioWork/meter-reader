import type { ReadingApiModel } from '@app-types/models';
import { formatCost } from '@utils/costUtils';
import { formatIsoDate } from '@utils/dateUtils';

type Props = {
  reading: ReadingApiModel;
};

const READING_LABEL = 'Reading';

// One reading's date, its digits and what it cost. The cost sits on the right, where the eye runs down the amounts.
function CostListItem({ reading }: Props) {
  return (
    <li className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="flex flex-col">
        <span className="font-medium">{formatIsoDate(reading.date)}</span>
        <span className="text-sm text-muted-foreground">
          {READING_LABEL} <span className="tabular-nums">{reading.digits}</span>
        </span>
      </div>
      {reading.costCents !== null && (
        <span className="font-semibold tabular-nums">{formatCost(reading.costCents)}</span>
      )}
    </li>
  );
}

export default CostListItem;
