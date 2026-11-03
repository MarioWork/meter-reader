import type { ReadingApiModel } from '@app-types/models';
import { formatCost } from '@utils/costUtils';
import { formatIsoDate } from '@utils/dateUtils';
import CostListBillLink from './CostListBillLink';

type Props = {
  reading: ReadingApiModel;
};

const READING_LABEL = 'Reading';
// A reading listed for its Bill alone: said, so its empty amount does not read as €0.00.
const NO_COST_TEXT = 'No cost';

// One reading's date, its digits, what it cost and a link to its Bill when it has one. The amount sits on the right,
// where the eye runs down the amounts.
function CostListItem({ reading }: Props) {
  return (
    <li className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="flex flex-col">
        <span className="font-medium">{formatIsoDate(reading.date)}</span>
        <span className="text-sm text-muted-foreground">
          {READING_LABEL} <span className="tabular-nums">{reading.digits}</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        {reading.bill !== null && <CostListBillLink billId={reading.bill.id} date={reading.date} />}
        {reading.costCents === null ? (
          <span className="text-sm text-muted-foreground">{NO_COST_TEXT}</span>
        ) : (
          <span className="font-semibold tabular-nums">{formatCost(reading.costCents)}</span>
        )}
      </div>
    </li>
  );
}

export default CostListItem;
