import type { ReadingApiModel } from '@app-types/models';
import BillButton from '@components/BillButton';
import MissingValue from '@components/MissingValue';
import RowDetailsLink from '@components/RowDetailsLink';
import { TableCell, TableRow } from '@components/ui/table';
import { cn } from '@utils/classNameUtils';
import { formatCost } from '@utils/costUtils';

type Props = {
  reading: ReadingApiModel;
};

// A reading with no cost: a dash on screen, which a screen reader hears as this, so it never reads as €0.00.
const NO_COST_TEXT = 'No cost';
const NO_BILL_TEXT = 'No bill';
const CELL_CLASS = 'px-3 py-1.5';

// One reading's row: its date (the link to its page, stretched over the row, so a click anywhere opens it), its digits,
// what it cost and its Bill's file name, which opens the bill, above the row's link.
function CostTableRow({ reading }: Props) {
  return (
    <TableRow className="relative hover:bg-accent">
      <TableCell className={CELL_CLASS}>
        <RowDetailsLink reading={reading} />
      </TableCell>
      <TableCell className={cn(CELL_CLASS, 'font-mono tabular-nums')}>{reading.digits}</TableCell>
      <TableCell className={cn(CELL_CLASS, 'tabular-nums')}>
        {reading.costCents === null ? (
          <MissingValue label={NO_COST_TEXT} />
        ) : (
          <span className="font-semibold">{formatCost(reading.costCents)}</span>
        )}
      </TableCell>
      <TableCell className={cn(CELL_CLASS, 'max-w-64')}>
        {reading.bill === null ? (
          <MissingValue label={NO_BILL_TEXT} />
        ) : (
          <span className="relative z-10">
            <BillButton bill={reading.bill} readingDate={reading.date} />
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}

export default CostTableRow;
