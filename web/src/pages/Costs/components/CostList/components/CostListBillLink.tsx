import type { BillId } from '@app-types/models';
import NewTabLink from '@components/NewTabLink';
import { buttonVariants } from '@components/ui/button';
import { getBillUrl } from '@utils/billUtils';
import { formatIsoDate } from '@utils/dateUtils';

type Props = {
  billId: BillId;
  date: string;
};

const BILL_TEXT = 'Bill';
const LINK_CLASSES = buttonVariants({ variant: 'outline', size: 'sm' });

// Starts with the word the link shows (WCAG 2.5.3), and names the reading, as every row has one.
function billLinkLabel(date: string): string {
  return `${BILL_TEXT} of ${formatIsoDate(date)}, opens in a new tab`;
}

// Opens the reading's Bill in a new tab (a PDF in the browser's own viewer). 28 px high, over the 24 px minimum target.
function CostListBillLink({ billId, date }: Props) {
  return (
    <NewTabLink href={getBillUrl(billId)} accessibleName={billLinkLabel(date)} className={LINK_CLASSES}>
      {BILL_TEXT}
    </NewTabLink>
  );
}

export default CostListBillLink;
