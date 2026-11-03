import { FileTextIcon } from 'lucide-react';
import { useId, useRef } from 'react';
import type { ReadingBillApiModel } from '@app-types/models';
import { formatIsoDate } from '@utils/dateUtils';
import BillViewer from './components/BillViewer';
import BillViewerContent from './components/BillViewerContent';
import { useBillViewer } from './hooks/useBillViewer';

type Props = {
  bill: ReadingBillApiModel;
  // For a list where every row has a bill: the reading's day tells them apart to a screen reader.
  readingDate?: string;
};

const OPENS_BILL = 'opens the bill';
// Underlined, so it reads as something to tap without its colour (WCAG 1.4.1); at least 24 px high (WCAG 2.5.8).
// The name is cut short with an ellipsis when the line is too narrow for it; a screen reader still hears all of it.
const BUTTON_CLASSES =
  'inline-flex min-h-6 max-w-full min-w-0 items-center gap-1.5 rounded-sm text-left text-sm font-medium text-primary underline underline-offset-4 outline-none hover:decoration-2 focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4 [&_svg]:shrink-0';

// Starts with the file name it shows (WCAG 2.5.3), then says what it opens.
function toAccessibleName(name: string, readingDate: string | undefined): string {
  if (readingDate === undefined) return `${name}, ${OPENS_BILL}`;

  return `${name}, ${OPENS_BILL} of ${formatIsoDate(readingDate)}`;
}

// A saved Bill, by its file name: one button that opens it in the app's own full-screen viewer. Nothing is saved to
// the device unless the viewer's Download is tapped. The viewer's content mounts afresh for each opening, so every
// bill starts at the screen's width.
function BillButton({ bill, readingDate }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const { isOpen, open, close, retry, viewerState } = useBillViewer(bill.id);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-label={toAccessibleName(bill.name, readingDate)}
        onClick={open}
        className={BUTTON_CLASSES}
      >
        <FileTextIcon aria-hidden="true" />
        <span className="truncate">{bill.name}</span>
      </button>
      <BillViewer isOpen={isOpen} titleId={titleId} returnFocusRef={buttonRef} onClose={close}>
        {isOpen && (
          <BillViewerContent
            titleId={titleId}
            billName={bill.name}
            viewerState={viewerState}
            onClose={close}
            onRetry={retry}
          />
        )}
      </BillViewer>
    </>
  );
}

export default BillButton;
