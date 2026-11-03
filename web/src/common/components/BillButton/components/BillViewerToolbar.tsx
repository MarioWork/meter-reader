import { DownloadIcon } from 'lucide-react';
import { Button } from '@components/ui/button';
import BillZoomControls from './BillZoomControls';

type Props = {
  zoom: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onDownload: () => void;
};

const DOWNLOAD_LABEL = 'Download';

// The zoom controls, then Download: the one way the bill is saved to the device. 36 px high, over the 24 px minimum.
function BillViewerToolbar({ zoom, canZoomIn, canZoomOut, onZoomIn, onZoomOut, onDownload }: Props) {
  return (
    <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
      <BillZoomControls
        zoom={zoom}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
      />
      <Button type="button" variant="outline" size="lg" onClick={onDownload}>
        <DownloadIcon data-icon="inline-start" aria-hidden="true" />
        {DOWNLOAD_LABEL}
      </Button>
    </div>
  );
}

export default BillViewerToolbar;
