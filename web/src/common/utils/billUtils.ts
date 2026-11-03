import axios from 'axios';
import type { BillContentType, BillId, ReadingBillApiModel } from '@app-types/models';
import { BASE_BILLS_URL } from '@services/billService/billService';

// Asks the API to send the file to be saved, not opened.
const DOWNLOAD_QUERY = '?download=true';
const BYTES_PER_KILOBYTE = 1000;
const BYTES_PER_MEGABYTE = 1_000_000;
const DISPLAY_LOCALE = 'en-GB';
const SIZE_FORMAT = new Intl.NumberFormat(DISPLAY_LOCALE, { maximumFractionDigits: 1 });

// The word for each kind of bill, as the user knows it.
const BILL_FILE_LABELS: Record<BillContentType, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
};

// Where a saved bill opens from: the API's own origin, so the session cookie goes with it. Built from the service's
// path and a numeric id only, never from text the API sent.
export function getBillUrl(billId: BillId): string {
  return `${axios.defaults.baseURL ?? ''}${BASE_BILLS_URL}/${billId}`;
}

// Where a saved bill downloads from, under a name the API gives it.
export function getBillDownloadUrl(billId: BillId): string {
  return `${getBillUrl(billId)}${DOWNLOAD_QUERY}`;
}

// 1000 bytes to the kilobyte, as phones and Finder count: "180 KB", "2.4 MB".
function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < BYTES_PER_MEGABYTE) return `${SIZE_FORMAT.format(sizeBytes / BYTES_PER_KILOBYTE)} KB`;

  return `${SIZE_FORMAT.format(sizeBytes / BYTES_PER_MEGABYTE)} MB`;
}

// What the bill is, in a few words: "PDF, 180 KB".
export function describeBill({ contentType, sizeBytes }: ReadingBillApiModel): string {
  return `${BILL_FILE_LABELS[contentType]}, ${formatFileSize(sizeBytes)}`;
}
