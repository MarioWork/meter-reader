import { ZoomInIcon, ZoomOutIcon } from 'lucide-react';
import { Button } from '@components/ui/button';

type Props = {
  zoom: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

const ZOOM_OUT_LABEL = 'Zoom out';
const ZOOM_IN_LABEL = 'Zoom in';
const ZOOM_PREFIX = 'Zoom';
const PERCENT = 100;
const PERCENT_SIGN = '%';

// Zoom out, the zoom as a percentage (read out as it changes), zoom in. 36 px square buttons, over the 24 px minimum.
function BillZoomControls({ zoom, canZoomIn, canZoomOut, onZoomIn, onZoomOut }: Props) {
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        aria-label={ZOOM_OUT_LABEL}
        disabled={!canZoomOut}
        onClick={onZoomOut}
      >
        <ZoomOutIcon aria-hidden="true" />
      </Button>
      <span aria-live="polite" className="min-w-14 text-center text-sm tabular-nums">
        <span className="sr-only">{ZOOM_PREFIX} </span>
        {Math.round(zoom * PERCENT)}
        {PERCENT_SIGN}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        aria-label={ZOOM_IN_LABEL}
        disabled={!canZoomIn}
        onClick={onZoomIn}
      >
        <ZoomInIcon aria-hidden="true" />
      </Button>
    </div>
  );
}

export default BillZoomControls;
