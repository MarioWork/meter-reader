import { useState } from 'react';

// 1 is the page as wide as the screen allows. The buttons step through these; a pinch lands anywhere between the ends.
const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
const FIT_WIDTH_ZOOM = 1;
const MIN_ZOOM = ZOOM_LEVELS[0];
const MAX_ZOOM = ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
// A pinch that stops a hair off a level still counts as on it.
const LEVEL_TOLERANCE = 0.01;

function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

// How far the pages are zoomed. `zoom` is what they are drawn at; `shownZoom` is their size on screen, which follows a
// pinch as it happens and is drawn sharp again once the fingers lift.
export function useBillZoom() {
  const [zoom, setZoom] = useState(FIT_WIDTH_ZOOM);
  const [pinchedZoom, setPinchedZoom] = useState<number>();

  const nextLevel = ZOOM_LEVELS.find((level) => level > zoom + LEVEL_TOLERANCE);
  const previousLevel = ZOOM_LEVELS.filter((level) => level < zoom - LEVEL_TOLERANCE).at(-1);

  const zoomIn = () => {
    if (nextLevel !== undefined) setZoom(nextLevel);
  };

  const zoomOut = () => {
    if (previousLevel !== undefined) setZoom(previousLevel);
  };

  const pinchTo = (zoomAtFingers: number) => setPinchedZoom(clampZoom(zoomAtFingers));

  const endPinch = () => {
    if (pinchedZoom !== undefined) setZoom(pinchedZoom);

    setPinchedZoom(undefined);
  };

  return {
    zoom,
    shownZoom: pinchedZoom ?? zoom,
    canZoomIn: nextLevel !== undefined,
    canZoomOut: previousLevel !== undefined,
    zoomIn,
    zoomOut,
    pinchTo,
    endPinch,
  };
}
