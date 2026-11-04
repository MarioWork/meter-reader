import type { ReadingBillApiModel } from '@app-types/models';
import { formatCost } from '@utils/costUtils';
import MissingValue from '@components/MissingValue';
import ReadingDetailsBill from './ReadingDetailsBill';

type Props = {
  costCents: number | null;
  bill: ReadingBillApiModel | null;
};

const LABEL_CLASSES = 'text-muted-foreground';
const COST_LABEL = 'Cost';
const BILL_LABEL = 'Bill';
const NO_COST = 'No cost';
const NO_BILL = 'No bill';

// The cost and the bill as label and value; one still missing is a quiet dash, which a screen reader hears as "No
// cost" or "No bill".
function CostAndBillList({ costCents, bill }: Props) {
  return (
    <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-3">
      <dt className={LABEL_CLASSES}>{COST_LABEL}</dt>
      {costCents === null ? (
        <dd>
          <MissingValue label={NO_COST} />
        </dd>
      ) : (
        <dd className="text-xl font-semibold tabular-nums">{formatCost(costCents)}</dd>
      )}
      <dt className={LABEL_CLASSES}>{BILL_LABEL}</dt>
      <dd>{bill === null ? <MissingValue label={NO_BILL} /> : <ReadingDetailsBill bill={bill} />}</dd>
    </dl>
  );
}

export default CostAndBillList;
