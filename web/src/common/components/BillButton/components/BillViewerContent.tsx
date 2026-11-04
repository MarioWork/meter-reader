import { downloadFile } from '../billDownloadUtils';
import type { BillViewerState } from '../types';
import { useBillZoom } from '../hooks/useBillZoom';
import BillPages from './BillPages';
import BillViewerFailure from './BillViewerFailure';
import BillViewerHeader from './BillViewerHeader';
import BillViewerLoading from './BillViewerLoading';
import BillViewerToolbar from './BillViewerToolbar';

type Props = {
  titleId: string;
  billName: string;
  viewerState: BillViewerState;
  onClose: () => void;
  onRetry: () => void;
};

// What the viewer shows while open: its one bar (with the zoom and Download once the bill is read), then the loading
// meter, the failure, or the pages.
function BillViewerContent({ titleId, billName, viewerState, onClose, onRetry }: Props) {
  const { zoom, shownZoom, canZoomIn, canZoomOut, zoomIn, zoomOut, pinchTo, endPinch } = useBillZoom();

  const billDocument = viewerState.status === 'loaded' ? viewerState.billDocument : undefined;

  return (
    <div className="flex h-full flex-col">
      <BillViewerHeader
        titleId={titleId}
        billName={billName}
        pageCount={billDocument?.pages.length}
        tools={
          billDocument && (
            <BillViewerToolbar
              zoom={zoom}
              canZoomIn={canZoomIn}
              canZoomOut={canZoomOut}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onDownload={() => downloadFile(billDocument.file, billName)}
            />
          )
        }
        onClose={onClose}
      />
      {viewerState.status === 'loading' && <BillViewerLoading />}
      {viewerState.status === 'failed' && <BillViewerFailure onRetry={onRetry} />}
      {billDocument && (
        <BillPages
          pages={billDocument.pages}
          zoom={zoom}
          shownZoom={shownZoom}
          onPinch={pinchTo}
          onPinchEnd={endPinch}
        />
      )}
    </div>
  );
}

export default BillViewerContent;
