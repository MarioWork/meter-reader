import type { PDFPageProxy } from 'pdfjs-dist';
import { usePinchZoom } from '../hooks/usePinchZoom';
import { useWindowWidth } from '../hooks/useWindowWidth';
import BillPage from './BillPage';

type Props = {
  pages: PDFPageProxy[];
  zoom: number;
  shownZoom: number;
  onPinch: (zoom: number) => void;
  onPinchEnd: () => void;
};

// The gap on each side of a page, as the p-4 below.
const PAGE_GUTTER_PX = 16;
// Zoomed out on a laptop, a page still reads like paper, not a poster.
const MAX_FIT_WIDTH_PX = 800;
const MIN_FIT_WIDTH_PX = 200;

function toFitWidth(windowWidth: number): number {
  const widthBetweenGutters = windowWidth - 2 * PAGE_GUTTER_PX;

  return Math.max(MIN_FIT_WIDTH_PX, Math.min(widthBetweenGutters, MAX_FIT_WIDTH_PX));
}

// Every page, one under the other, scrolling both ways once zoomed past the screen. Zoom 1 fits a page to the
// screen's width. The pages sit on the muted background, as sheets of paper do.
function BillPages({ pages, zoom, shownZoom, onPinch, onPinchEnd }: Props) {
  const fitWidth = toFitWidth(useWindowWidth());
  const pinchHandlers = usePinchZoom(zoom, onPinch, onPinchEnd);

  return (
    <div className="min-h-0 flex-1 touch-pan-x touch-pan-y overflow-auto bg-muted" {...pinchHandlers}>
      <div className="flex w-max min-w-full flex-col items-center gap-4 p-4">
        {pages.map((page) => (
          <BillPage
            key={page.pageNumber}
            page={page}
            pageCount={pages.length}
            width={fitWidth * shownZoom}
            drawnWidth={fitWidth * zoom}
          />
        ))}
      </div>
    </div>
  );
}

export default BillPages;
