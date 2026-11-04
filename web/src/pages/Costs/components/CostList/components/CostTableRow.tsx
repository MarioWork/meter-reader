import type { ReadingApiModel } from '@app-types/models';
import BillButton from '@components/BillButton';
import MissingValue from '@components/MissingValue';
import { TableCell, TableRow } from '@components/ui/table';
import { cn } from '@utils/classNameUtils';
import { formatCost } from '@utils/costUtils';
import { formatIsoDate } from '@utils/dateUtils';

type Props = {
  reading: ReadingApiModel;
};

// A reading listed for its Bill alone: said, so its empty amount does not read as €0.00.
const NO_COST_TEXT = 'No cost';
const NO_BILL_TEXT = 'No bill';
const CELL_CLASS = 'px-3 py-1.5';

// One reading's row: its date, its digits, what it cost and its Bill's file name, which opens it, when it has one.
function CostTableRow({ reading }: Props) {
  return (
    <TableRow>
      <TableCell className={cn(CELL_CLASS, 'font-medium')}>{formatIsoDate(reading.date)}</TableCell>
      <TableCell className={cn(CELL_CLASS, 'font-mono tabular-nums')}>{reading.digits}</TableCell>
      <TableCell className={cn(CELL_CLASS, 'text-right tabular-nums')}>
        {reading.costCents === null ? (
          <span className="text-muted-foreground">{NO_COST_TEXT}</span>
        ) : (
          <span className="font-semibold">{formatCost(reading.costCents)}</span>
        )}
      </TableCell>
      <TableCell className={CELL_CLASS}>
        {reading.bill === null ? (
          <MissingValue label={NO_BILL_TEXT} />
        ) : (
          <BillButton bill={reading.bill} readingDate={reading.date} />
        )}
      </TableCell>
    </TableRow>
  );
}

export default CostTableRow;
