// The backup: the CSV's columns, one line per reading, read off the same reading the JSON holds, and what the files
// are called. A new field is one more column here.
import { toCsv, type CsvColumn } from '../../lib/csv.ts';
import type { BackupReading } from './readings.schema.ts';

// An ISO timestamp's first ten characters are its calendar day.
const ISO_DATE_LENGTH = 10;
const FILE_NAME_BASE = 'water-readings-backup';
export const JSON_EXTENSION = '.json';
export const CSV_EXTENSION = '.csv';

const BACKUP_CSV_COLUMNS: CsvColumn<BackupReading>[] = [
  { header: 'id', valueOf: (reading) => reading.id },
  { header: 'date', valueOf: (reading) => reading.date },
  // Text, as read: "00123" keeps its zeros.
  { header: 'digits', valueOf: (reading) => reading.digits },
  { header: 'status', valueOf: (reading) => reading.status },
  { header: 'sent_at', valueOf: (reading) => reading.sentAt },
  { header: 'sent_from', valueOf: (reading) => reading.sentEmail?.from ?? null },
  { header: 'sent_to', valueOf: (reading) => reading.sentEmail?.to ?? null },
  { header: 'sent_subject', valueOf: (reading) => reading.sentEmail?.subject ?? null },
  { header: 'sent_body', valueOf: (reading) => reading.sentEmail?.body ?? null },
  { header: 'sent_with_photo', valueOf: (reading) => reading.sentEmail?.hasPhoto ?? null },
  { header: 'photo_file_name', valueOf: (reading) => reading.photoFileName },
];

export function toReadingsBackupCsv(readings: BackupReading[]): string {
  return toCsv(readings, BACKUP_CSV_COLUMNS);
}

// water-readings-backup-2026-11-03.json: the day it was made, so one backup never overwrites another.
export function readingsBackupFileName(exportedAt: Date, extension: string): string {
  return `${FILE_NAME_BASE}-${exportedAt.toISOString().slice(0, ISO_DATE_LENGTH)}${extension}`;
}
