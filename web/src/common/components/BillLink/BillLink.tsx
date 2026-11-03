import type { ReadingBillApiModel } from '@app-types/models';
import NewTabLink from '@components/NewTabLink';
import { getBillUrl } from '@utils/billUtils';
import { formatIsoDate } from '@utils/dateUtils';

type Props = {
  bill: ReadingBillApiModel;
  // For a list where every row has a bill: the reading's day tells them apart to a screen reader.
  readingDate?: string;
};

const OPENS_BILL = 'opens the bill';
const IN_A_NEW_TAB = 'in a new tab';
// Underlined, so it reads as a link without its colour (WCAG 1.4.1); at least 24 px high (WCAG 2.5.8). The name
// is cut short with an ellipsis when the line is too narrow for it; a screen reader still hears all of it.
const LINK_CLASSES =
  'inline-flex min-h-6 max-w-full min-w-0 items-center gap-1.5 rounded-sm text-sm font-medium text-primary underline underline-offset-4 outline-none hover:decoration-2 focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4 [&_svg]:shrink-0';

// Starts with the file name it shows (WCAG 2.5.3), then says what it opens and where.
function toAccessibleName(name: string, readingDate: string | undefined): string {
  if (readingDate === undefined) return `${name}, ${OPENS_BILL} ${IN_A_NEW_TAB}`;

  return `${name}, ${OPENS_BILL} of ${formatIsoDate(readingDate)} ${IN_A_NEW_TAB}`;
}

// A saved Bill, by its file name: one link that opens it in a new tab, where the browser shows a PDF or an image
// itself, or a phone hands it to its viewer app. Saving it is left to that viewer.
function BillLink({ bill, readingDate }: Props) {
  return (
    <NewTabLink
      href={getBillUrl(bill.id)}
      accessibleName={toAccessibleName(bill.name, readingDate)}
      className={LINK_CLASSES}
    >
      <span className="truncate">{bill.name}</span>
    </NewTabLink>
  );
}

export default BillLink;
