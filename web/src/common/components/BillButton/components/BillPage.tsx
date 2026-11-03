import { useEffect, useRef, useState } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';

type Props = {
  page: PDFPageProxy;
  pageCount: number;
  // Its width on screen, in CSS pixels; the height follows the page's own shape.
  width: number;
  // The width its pixels are drawn for: the same, except mid-pinch, when the page is stretched until the fingers lift.
  drawnWidth: number;
};

const UNZOOMED = 1;
// The largest canvas iPhone Safari draws (4096 × 4096); a bigger one stays blank.
const MAX_CANVAS_PIXELS = 16_777_216;
// What pdf.js rejects a render with once it is cancelled: expected, when the zoom changes mid-render.
const RENDERING_CANCELLED = 'RenderingCancelledException';
const PAGE_LABEL = 'Page';
const FAILED_TEXT = "couldn't be shown.";

// How many canvas pixels to draw per PDF point: sharp on the screen's own pixels, within the canvas limit.
function toDrawScale(pageWidth: number, pageHeight: number, drawnWidth: number): number {
  const sharpScale = (drawnWidth * window.devicePixelRatio) / pageWidth;
  const largestScale = Math.sqrt(MAX_CANVAS_PIXELS / (pageWidth * pageHeight));

  return Math.min(sharpScale, largestScale);
}

function isCancelled(error: unknown): boolean {
  return error instanceof Error && error.name === RENDERING_CANCELLED;
}

// One page of the bill, drawn by pdf.js onto a canvas, which a screen reader hears as "Page 1 of 2".
function BillPage({ page, pageCount, width, drawnWidth }: Props) {
  const { pageNumber } = page;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasFailed, setHasFailed] = useState(false);

  const pageSize = page.getViewport({ scale: UNZOOMED });
  const height = (width * pageSize.height) / pageSize.width;
  const drawScale = toDrawScale(pageSize.width, pageSize.height, drawnWidth);
  const drawnSize = page.getViewport({ scale: drawScale });

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const renderTask = page.render({ canvas, viewport: page.getViewport({ scale: drawScale }) });

    renderTask.promise.catch((error: unknown) => {
      if (!isCancelled(error)) setHasFailed(true);
    });

    return () => renderTask.cancel();
  }, [page, drawScale]);

  if (hasFailed) {
    return (
      <p
        className="flex items-center justify-center bg-card p-4 text-sm text-muted-foreground"
        style={{ width, height }}
      >
        {PAGE_LABEL} {pageNumber} {FAILED_TEXT}
      </p>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={Math.floor(drawnSize.width)}
      height={Math.floor(drawnSize.height)}
      role="img"
      aria-label={`${PAGE_LABEL} ${pageNumber} of ${pageCount}`}
      className="shrink-0 bg-card shadow-sm"
      style={{ width, height }}
    />
  );
}

export default BillPage;
