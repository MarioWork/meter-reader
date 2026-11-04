import type { ReadingApiModel } from '@app-types/models';
import BillButton from '@components/BillButton';
import { TableCell } from '@components/ui/table';
import { cn } from '@utils/classNameUtils';
import { ABOVE_DETAILS_LINK } from '../readingTableUtils';
import MissingValue from '@components/MissingValue';

type Props = {
  reading: ReadingApiModel;
};

const NO_BILL = 'No bill';

// A row's bill, as the button that opens it in the viewer, named with the reading's day; a dash until it has one.
function BillCell({ reading }: Props) {
  if (reading.bill === null) {
    return (
      <TableCell>
        <MissingValue label={NO_BILL} />
      </TableCell>
    );
  }

  return (
    <TableCell className={cn(ABOVE_DETAILS_LINK, 'max-w-56')}>
      <BillButton bill={reading.bill} readingDate={reading.date} />
    </TableCell>
  );
}

export default BillCell;
