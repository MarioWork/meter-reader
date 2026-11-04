import { DownloadIcon } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/ui/tooltip';
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

// The zoom controls, then Download: the one way the bill is saved to the device, as an icon named by its label, which
// also shows as a tooltip on hover and on keyboard focus. 36 px square, over the 24 px minimum. The viewer is a modal
// <dialog> in the browser's top layer, so the tooltip is put inside the toolbar: in the page's body it would sit
// behind the dialog.
function BillViewerToolbar({ zoom, canZoomIn, canZoomOut, onZoomIn, onZoomOut, onDownload }: Props) {
  const toolbarRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={toolbarRef} className="flex items-center justify-between gap-2 border-b px-4 py-2">
      <BillZoomControls
        zoom={zoom}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
      />
      <Tooltip>
        <TooltipTrigger
          render={
            <Button type="button" variant="outline" size="icon-lg" aria-label={DOWNLOAD_LABEL} onClick={onDownload} />
          }
        >
          <DownloadIcon aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent container={toolbarRef}>{DOWNLOAD_LABEL}</TooltipContent>
      </Tooltip>
    </div>
  );
}

export default BillViewerToolbar;
