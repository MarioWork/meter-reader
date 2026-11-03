import { useEffect, useState } from 'react';
import { useFetcher } from 'react-router';
import { BILL_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { BillId } from '@app-types/models';
import type { LoaderDataUtil } from '@app-types/utility';
import type { loader } from '../billViewerLoader';
import type { BillViewerState } from '../types';

type LoadedBill = LoaderDataUtil<typeof loader>;

function toViewerState(loadedBill: LoadedBill | undefined): BillViewerState {
  if (loadedBill === undefined) return { status: 'loading' };

  if (loadedBill.billDocument === null) return { status: 'failed' };

  return { status: 'loaded', billDocument: loadedBill.billDocument };
}

// Whether the viewer is open, and the bill it shows. Every opening fetches the bill afresh, through the bill's
// loader-only route, so it comes from the signed-in app itself: no new tab, no download.
export function useBillViewer(billId: BillId) {
  const fetcher = useFetcher<typeof loader>();
  const [isOpen, setIsOpen] = useState(false);
  // The answer the last opening showed, let go of on closing: the next opening waits for a fresh one instead.
  const [staleBill, setStaleBill] = useState<LoadedBill>();

  const loadedBill = fetcher.data;
  const isFetching = fetcher.state !== 'idle';
  const isStale = loadedBill !== undefined && loadedBill === staleBill;
  const shownBill = isOpen && !isFetching && !isStale ? loadedBill : undefined;

  // pdf.js keeps a worker for each PDF it reads. Each one is let go of once a newer answer replaces it, or the bill
  // leaves the page; destroying one twice is harmless.
  useEffect(() => {
    const billDocument = loadedBill?.billDocument;

    if (!billDocument) return;

    return () => void billDocument.destroy();
  }, [loadedBill]);

  const load = () => void fetcher.load(BILL_ROUTES_PATHS.view(String(billId)));

  const open = () => {
    load();
    setIsOpen(true);
  };

  const close = () => {
    void loadedBill?.billDocument?.destroy();
    setStaleBill(loadedBill);
    setIsOpen(false);
  };

  return { isOpen, open, close, retry: load, viewerState: toViewerState(shownBill) };
}
