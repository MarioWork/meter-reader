import type { BackupReadingApiModel, ReadingsBackupApiModel } from '@app-types/models';

// The API's file (api/src/modules/readings/readings.backup.ts and api/src/lib/csv.ts), so the mock opens the same
// way: the same columns, quoting and formula guard.
const CSV_SEPARATOR = ',';
const CSV_LINE_BREAK = '\r\n';
const NEEDS_QUOTING = /[",\r\n]/;
const FORMULA_START = /^[=+\-@\t\r]/;
const FORMULA_ESCAPE = "'";

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

  const raw = String(value);
  const isFormula = typeof value === 'string' && FORMULA_START.test(raw);
  const text = isFormula ? `${FORMULA_ESCAPE}${raw}` : raw;

  if (!NEEDS_QUOTING.test(text)) return text;

  return `"${text.replaceAll('"', '""')}"`;
}

function toCsvLine(reading: BackupReadingApiModel): string {
  return Object.values(CSV_COLUMNS)
    .map((valueOf) => toCsvCell(valueOf(reading)))
    .join(CSV_SEPARATOR);
}

// A header line, then one line per reading, each ending in CRLF.
export const createReadingsBackupCsvMockModel = ({ readings }: ReadingsBackupApiModel): string => {
  const header = Object.keys(CSV_COLUMNS).join(CSV_SEPARATOR);
  const lines = readings.map(toCsvLine);

  return [header, ...lines].map((line) => `${line}${CSV_LINE_BREAK}`).join('');
};
