import { XIcon } from 'lucide-react';
import { Button } from '@components/ui/button';

type Props = {
  titleId: string;
  billName: string;
  // Known once the bill is read.
  pageCount?: number;
  onClose: () => void;
};

const CLOSE_LABEL = 'Close';
const ONE_PAGE = 1;

function formatPageCount(pageCount: number): string {
  if (pageCount === ONE_PAGE) return `${ONE_PAGE} page`;

  return `${pageCount} pages`;
}

// The bill's file name, which names the viewer, its page count, and the × that closes it (36 px square, over the
// 24 px minimum target).
function BillViewerHeader({ titleId, billName, pageCount, onClose }: Props) {
  return (
    <header className="flex items-center gap-3 border-b px-4 py-2">
      <div className="min-w-0 flex-1">
        <h2 id={titleId} className="truncate font-semibold">
          {billName}
        </h2>
        {pageCount !== undefined && <p className="text-sm text-muted-foreground">{formatPageCount(pageCount)}</p>}
      </div>
      <Button type="button" variant="ghost" size="icon-lg" aria-label={CLOSE_LABEL} onClick={onClose}>
        <XIcon aria-hidden="true" />
      </Button>
    </header>
  );
}

export default BillViewerHeader;
