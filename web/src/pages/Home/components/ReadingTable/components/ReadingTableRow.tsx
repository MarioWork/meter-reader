import type { ReadingApiModel } from '@app-types/models';
import { TableCell, TableRow } from '@components/ui/table';
import { formatCost } from '@utils/costUtils';
import ReadingSendStatus from '@components/ReadingSendStatus';
import BillCell from './BillCell';
import MissingValue from './MissingValue';
import RowActionsCell from './RowActionsCell';
import RowDetailsLink from './RowDetailsLink';

type Props = {
  reading: ReadingApiModel;
};

const NO_COST = 'No cost';

// One reading as a row: its day (the link to its details, stretched over the row), the digits, the status, the cost
// and the bill, then Send or Try again while it can still go, and the "⋯" menu.
function ReadingTableRow({ reading }: Props) {
  return (
    <TableRow className="relative">
      <TableCell>
        <RowDetailsLink reading={reading} />
      </TableCell>
      <TableCell className="font-mono text-base tabular-nums">{reading.digits}</TableCell>
      <TableCell>
        <ReadingSendStatus reading={reading} />
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {reading.costCents === null ? <MissingValue label={NO_COST} /> : formatCost(reading.costCents)}
      </TableCell>
      <BillCell reading={reading} />
      <RowActionsCell reading={reading} />
    </TableRow>
  );
}

export default ReadingTableRow;
