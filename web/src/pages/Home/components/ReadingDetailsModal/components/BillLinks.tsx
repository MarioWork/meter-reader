import type { ReadingBillApiModel } from '@app-types/models';
import DownloadLink from '@components/DownloadLink';
import NewTabLink from '@components/NewTabLink';
import { buttonVariants } from '@components/ui/button';
import { describeBill, getBillDownloadUrl, getBillUrl } from '@utils/billUtils';

type Props = {
  bill: ReadingBillApiModel;
};

const OPEN_TEXT = 'Open';
const DOWNLOAD_TEXT = 'Download';
// The names screen readers hear start with the word each link shows (WCAG 2.5.3).
const OPEN_LABEL = 'Open the bill in a new tab';
const DOWNLOAD_LABEL = 'Download the bill';
const LINK_CLASSES = buttonVariants({ variant: 'outline', size: 'default' });

// The reading's bill: what it is, then Open (a new tab, a PDF in the browser's own viewer) and Download. Links, as
// they go somewhere; 32 px high, over the 24 px minimum target.
function BillLinks({ bill }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="text-sm">{describeBill(bill)}</span>
      <div className="flex gap-2">
        <NewTabLink href={getBillUrl(bill.id)} accessibleName={OPEN_LABEL} className={LINK_CLASSES}>
          {OPEN_TEXT}
        </NewTabLink>
        <DownloadLink href={getBillDownloadUrl(bill.id)} label={DOWNLOAD_TEXT} accessibleName={DOWNLOAD_LABEL} />
      </div>
    </div>
  );
}

export default BillLinks;
