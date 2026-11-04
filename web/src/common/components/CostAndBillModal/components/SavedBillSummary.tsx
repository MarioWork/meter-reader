import type { ReadingBillApiModel } from '@app-types/models';
import BillButton from '@components/BillButton';
import { describeBill } from '@utils/billUtils';

type Props = {
  bill: ReadingBillApiModel;
};

const SAVED_PREFIX = 'Saved bill:';

// "Saved bill:", the bill's file name, which opens it in the app's viewer, then what it is ("PDF, 180 KB"). A <div>,
// not a <p>: the viewer's <dialog> sits next to the button and cannot go inside a paragraph.
function SavedBillSummary({ bill }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span>{SAVED_PREFIX}</span>
      <BillButton bill={bill} />
      <span className="text-muted-foreground">{describeBill(bill)}</span>
    </div>
  );
}

export default SavedBillSummary;
