import type {
  BackupReadingApiModel,
  BillContentType,
  ReadingApiModel,
  ReadingsBackupApiModel,
} from '@app-types/models';
import { CENTS_DIGITS, CENTS_PER_EURO } from '@utils/costUtils';

// Fixed, so every run serves the same file: the moment the mock backup says it was made.
const MOCK_EXPORTED_AT = '2026-11-03T09:00:00.000Z';
// A file's name on the server is a random UUID and its extension; here one made from its id, so it stays the same
// every run. Photos and bills have their own prefix, so a photo and a bill with the same id never share a name.
const PHOTO_FILE_NAME_PREFIX = '00000000-0000-4000-8000-';
const BILL_FILE_NAME_PREFIX = '00000000-0000-4000-9000-';
const FILE_ID_LENGTH = 12;
const PHOTO_EXTENSION = '.jpg';
// As the API saves each kind of bill (api/src/modules/bills/bills.service.ts).
const BILL_EXTENSIONS: Record<BillContentType, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
};

function fileName(prefix: string, id: number, extension: string): string {
  return `${prefix}${String(id).padStart(FILE_ID_LENGTH, '0')}${extension}`;
}

function photoFileName(photoId: ReadingApiModel['photoId']): string | null {
  if (photoId === null) return null;

  return fileName(PHOTO_FILE_NAME_PREFIX, photoId, PHOTO_EXTENSION);
}

function billFileName(bill: ReadingApiModel['bill']): string | null {
  if (bill === null) return null;

  return fileName(BILL_FILE_NAME_PREFIX, bill.id, BILL_EXTENSIONS[bill.contentType]);
}

// 4210 → "42.10", worked out on the whole cents as the API writes a Cost in the backup.
function costEuros(costCents: ReadingApiModel['costCents']): string | null {
  if (costCents === null) return null;

  const euros = Math.floor(costCents / CENTS_PER_EURO);
  const cents = String(costCents % CENTS_PER_EURO).padStart(CENTS_DIGITS, '0');

  return `${euros}.${cents}`;
}

export const createBackupReadingMockModel = (reading: ReadingApiModel): BackupReadingApiModel => ({
  id: reading.id,
  digits: reading.digits,
  date: reading.date,
  status: reading.status,
  sentAt: reading.sentAt,
  sentEmail: reading.sentEmail,
  photoFileName: photoFileName(reading.photoId),
  costEuros: costEuros(reading.costCents),
  billFileName: billFileName(reading.bill),
});

// The backup of the mock history, in the order it is given (the history's, newest first).
export const createReadingsBackupMockModel = (readings: ReadingApiModel[]): ReadingsBackupApiModel => ({
  exportedAt: MOCK_EXPORTED_AT,
  readings: readings.map(createBackupReadingMockModel),
});
