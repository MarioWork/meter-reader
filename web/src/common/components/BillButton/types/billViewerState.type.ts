import type { BillDocument } from './billDocument.type';

// What the open viewer shows: a spinner, a failure with Try again, or the bill.
export type BillViewerState =
  { status: 'loading' } | { status: 'failed' } | { status: 'loaded'; billDocument: BillDocument };
