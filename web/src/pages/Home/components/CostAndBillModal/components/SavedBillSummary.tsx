import type { ReadingBillApiModel } from '@app-types/models';
import BillLink from '@components/BillLink';
import { describeBill } from '@utils/billUtils';

type Props = {
  bill: ReadingBillApiModel;
};

const SAVED_PREFIX = 'Saved bill:';

// "Saved bill:", the bill's file name as a link that opens it in a new tab, then what it is ("PDF, 180 KB").
function SavedBillSummary({ bill }: Props) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span>{SAVED_PREFIX}</span>
      <BillLink bill={bill} />
      <span className="text-muted-foreground">{describeBill(bill)}</span>
    </p>
  );
}

export default SavedBillSummary;
