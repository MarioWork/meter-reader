import type { ReadingApiModel } from '@app-types/models';
import BillButton from '@components/BillButton';
import MissingValue from '@components/MissingValue';
import RowDetailsLink from '@components/RowDetailsLink';
import { formatCost } from '@utils/costUtils';

type Props = {
  reading: ReadingApiModel;
};

const READING_LABEL = 'Reading';
// A reading with no cost: a dash on screen, which a screen reader hears as this, so it never reads as €0.00.
const NO_COST_TEXT = 'No cost';
// The bill by a word, not its file name: a phone has no room for it, and the amounts must stay in line.
const BILL_LABEL = 'Bill';

// One reading's date (the link to its page, stretched over the row, so a tap anywhere opens it), its digits, what it
// cost and "Bill", which opens its bill, above the row's link, when it has one. The amount sits on
// the right, where the eye runs down the amounts.
function CostListItem({ reading }: Props) {
  return (
    <li className="relative flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="flex shrink-0 flex-col">
        <RowDetailsLink reading={reading} />
        <span className="text-sm text-muted-foreground">
          {READING_LABEL} <span className="tabular-nums">{reading.digits}</span>
        </span>
      </div>
      <div className="flex min-w-0 items-center gap-3">
        {reading.bill !== null && (
          <span className="relative z-10">
            <BillButton bill={reading.bill} readingDate={reading.date} label={BILL_LABEL} />
          </span>
        )}
        {reading.costCents === null ? (
          <span className="shrink-0">
            <MissingValue label={NO_COST_TEXT} />
          </span>
        ) : (
          <span className="shrink-0 font-semibold tabular-nums">{formatCost(reading.costCents)}</span>
        )}
      </div>
    </li>
  );
}

export default CostListItem;
