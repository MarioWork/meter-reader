import type { ReadingApiModel } from '@app-types/models';
import BillButton from '@components/BillButton';
import { formatCost } from '@utils/costUtils';
import { formatIsoDate } from '@utils/dateUtils';

type Props = {
  reading: ReadingApiModel;
};

const READING_LABEL = 'Reading';
// A reading listed for its Bill alone: said, so its empty amount does not read as €0.00.
const NO_COST_TEXT = 'No cost';

// One reading's date, its digits, what it cost and its Bill's file name, which opens it, when it has one. The amount sits
// on the right, where the eye runs down the amounts; a long file name is cut short before it pushes them off.
function CostListItem({ reading }: Props) {
  return (
    <li className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="flex shrink-0 flex-col">
        <span className="font-medium">{formatIsoDate(reading.date)}</span>
        <span className="text-sm text-muted-foreground">
          {READING_LABEL} <span className="tabular-nums">{reading.digits}</span>
        </span>
      </div>
      <div className="flex min-w-0 items-center gap-3">
        {reading.bill !== null && <BillButton bill={reading.bill} readingDate={reading.date} />}
        {reading.costCents === null ? (
          <span className="shrink-0 text-sm text-muted-foreground">{NO_COST_TEXT}</span>
        ) : (
          <span className="shrink-0 font-semibold tabular-nums">{formatCost(reading.costCents)}</span>
        )}
      </div>
    </li>
  );
}

export default CostListItem;
