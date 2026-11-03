import type { BackupApiModel, BackupReadingApiModel } from '@app-types/models';

// The API's columns (api/src/modules/backup/backup.csv.ts), so the mock file opens the same way.
const CSV_SEPARATOR = ',';
const CSV_LINE_BREAK = '\r\n';
const NEEDS_QUOTING = /[",\r\n]/;

type CsvCell = string | boolean | number | null;

const CSV_COLUMNS: Record<string, (reading: BackupReadingApiModel) => CsvCell> = {
  id: (reading) => reading.id,
  date: (reading) => reading.date,
  digits: (reading) => reading.digits,
  status: (reading) => reading.status,
  sent_at: (reading) => reading.sentAt,
  sent_from: (reading) => reading.sentEmail?.from ?? null,
  sent_to: (reading) => reading.sentEmail?.to ?? null,
  sent_subject: (reading) => reading.sentEmail?.subject ?? null,
  sent_body: (reading) => reading.sentEmail?.body ?? null,
  sent_with_photo: (reading) => reading.sentEmail?.hasPhoto ?? null,
  photo_file_name: (reading) => reading.photoFileName,
};

function toCsvCell(value: CsvCell): string {
  if (value === null) return '';

  const text = String(value);

  if (!NEEDS_QUOTING.test(text)) return text;

  return `"${text.replaceAll('"', '""')}"`;
}

function toCsvLine(reading: BackupReadingApiModel): string {
  return Object.values(CSV_COLUMNS)
    .map((valueOf) => toCsvCell(valueOf(reading)))
    .join(CSV_SEPARATOR);
}

// A header line, then one line per reading, each ending in CRLF.
export const createBackupCsvMockModel = ({ readings }: BackupApiModel): string => {
  const header = Object.keys(CSV_COLUMNS).join(CSV_SEPARATOR);
  const lines = readings.map(toCsvLine);

  return [header, ...lines].map((line) => `${line}${CSV_LINE_BREAK}`).join('');
};
