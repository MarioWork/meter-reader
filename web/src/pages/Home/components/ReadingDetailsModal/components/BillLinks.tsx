import { DownloadIcon, ExternalLinkIcon } from 'lucide-react';
import type { ReadingBillApiModel } from '@app-types/models';
import { buttonVariants } from '@components/ui/button';
import { describeBill, getBillDownloadUrl, getBillUrl } from '@pages/Home/readingBillUtils';

type Props = {
  bill: ReadingBillApiModel;
};

const OPEN_TEXT = 'Open';
const DOWNLOAD_TEXT = 'Download';
// The names screen readers hear start with the word each link shows (WCAG 2.5.3).
const OPEN_LABEL = 'Open the bill in a new tab';
const DOWNLOAD_LABEL = 'Download the bill';
const NEW_TAB = '_blank';
// The new tab gets no handle on this one.
const NEW_TAB_REL = 'noopener noreferrer';
const LINK_CLASSES = buttonVariants({ variant: 'outline', size: 'default' });

// The reading's bill: what it is, then Open (a new tab, a PDF in the browser's own viewer) and Download. Links, as
// they go somewhere; 32 px high, over the 24 px minimum target.
function BillLinks({ bill }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="text-sm">{describeBill(bill)}</span>
      <div className="flex gap-2">
        <a
          className={LINK_CLASSES}
          href={getBillUrl(bill.id)}
          target={NEW_TAB}
          rel={NEW_TAB_REL}
          aria-label={OPEN_LABEL}
        >
          <ExternalLinkIcon aria-hidden="true" />
          {OPEN_TEXT}
        </a>
        <a className={LINK_CLASSES} href={getBillDownloadUrl(bill.id)} download aria-label={DOWNLOAD_LABEL}>
          <DownloadIcon aria-hidden="true" />
          {DOWNLOAD_TEXT}
        </a>
      </div>
    </div>
  );
}

export default BillLinks;
