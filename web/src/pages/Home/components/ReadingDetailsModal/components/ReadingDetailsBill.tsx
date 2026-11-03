import type { ReadingBillApiModel } from '@app-types/models';
import BillLink from '@components/BillLink';
import { describeBill } from '@utils/billUtils';

type Props = {
  bill: ReadingBillApiModel;
};

// The reading's bill: its file name, a link that opens it in a new tab, then what it is ("PDF, 180 KB").
function ReadingDetailsBill({ bill }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <BillLink bill={bill} />
      <span className="text-sm text-muted-foreground">{describeBill(bill)}</span>
    </div>
  );
}

export default ReadingDetailsBill;
